import pandas as pd
import os
import numpy as np
from matplotlib import pyplot as plt
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_squared_error
from tensorflow.python.keras import Sequential
from tensorflow.python.keras.layers import Dense
from tensorflow.python.keras import backend
from tensorflow.python.keras.callbacks import EarlyStopping, ModelCheckpoint

scriptdir = os.path.dirname(os.path.abspath(__file__))
os.chdir( scriptdir )

def main():

    # some variables
    epochs = 10
    batch_size = 10
    split = 0.2
    k_fold = 5
    patience = 1

    # Importing the dataset
    df = pd.read_csv('./subject_csv/combined_data.csv')
    x_markers = df.iloc[:, 16:-1].values          # ivs: marker positions
    y_anthro = df.iloc[:, 1:16].values            # dvs: anthro values
    x_marker_names = df.columns.values[16:-1]     # ivs: marker names
    y_anthro_names = df.columns.values[1:16]      # dvs: anthro names
    users = df.iloc[:, 0]

    # Splitting the dataset into the Training set and hold out set
    x, x_test, y, y_test = train_test_split(x_markers, y_anthro, test_size=split, random_state=0)

    # Feature Scaling always needed in ANN
    # - todo: need a good way to scale the markers. Suggestion: normalize by distance from a pelvis marker
    # sc = StandardScaler()
    # X_train = sc.fit_transform(X_train)
    # X_test = sc.transform(X_test)

    # evaluate model for each y using 10 fold cross-val
    max_error = []
    mean_error = []
    std_error = []
    for i in range(len(y_anthro_names)):
        rmse = []
        k = 0
        print('performing regression for {}'.format(y_anthro_names[i]))
        kf = KFold(n_splits=k_fold, shuffle=True, random_state=0)
        for train_index, val_index in kf.split(y):

            # display cross val info to user
            # cur_train_records = [users[j] for j in train_index]
            cur_val_records = [users[j] for j in val_index]
            print('Cross-val {0}: {1} training trials and {2} validation trials'
                  .format(k+1, len(train_index), len(val_index)))
            #print('train set users: {}'.format(cur_train_records))
            print('val set users: {}'.format(cur_val_records))

            # load data
            x_train = x[train_index, :]
            y_train = y[train_index, i]
            x_val = x[val_index, :]
            y_val = y[val_index, i]

            # load and evaluate model
            callbacks = [EarlyStopping(monitor='val_loss', patience=patience, verbose=0)]
            model = ann_regressor(n_markers=x_train.shape[1])
            model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=epochs, batch_size=batch_size,
                      callbacks=callbacks)

            # predict and evaluate on unseen data
            y_pred = model.predict(x_test)
            rmse.append(root_mean_squared_error(y_test[:, i], y_pred))  # RMSE

            k += 1

        # summarize results
        max_error.append(np.max(rmse))
        mean_error.append(np.mean(rmse))
        std_error.append(np.std(rmse))

        print('RMSE between true and predicted values for {0} = {1:.2f} +/- {2:.2f} mm'
              .format(y_anthro_names[i], np.mean(rmse), np.std(rmse)))

    # save all results to csv using pandas
    df = pd.DataFrame(data=y_anthro_names, columns=['parameter'])
    df['RMSE_max (mm)'] = pd.Series(max_error)
    df['RMSE_mean (mm)'] = pd.Series(mean_error)
    df['RMSE_std (mm)'] = pd.Series(std_error)
    df.to_csv(os.path.join(os.getcwd(), 'results', 'ann_regression_results.csv'))


def ann_regressor(n_markers=102):
    model = Sequential()
    model.add(Dense(n_markers, input_dim=n_markers, kernel_initializer='normal', activation='relu'))
    model.add(Dense(1, kernel_initializer='normal'))
    # model.compile(loss='mean_squared_error', optimizer='adam')
    model.compile(optimizer="rmsprop", loss=root_mean_squared_error_keras, metrics=["accuracy"])
    return model


def root_mean_squared_error(y_true, y_pred):
    return np.sqrt(mean_squared_error(y_true, y_pred))


def root_mean_squared_error_keras(y_true, y_pred):
    """ custom RMSE so that error remains in same units as inputs"""
    return backend.sqrt(backend.mean(backend.square(y_pred - y_true), axis=-1))


def model_callbacks(model_file, patience=1):
    """ keras callbacks to force an early stop and save best model"""
    callbacks = []
    callbacks.append(EarlyStopping(monitor='val_loss', patience=patience, verbose=1))
    # callbacks.append(ModelCheckpoint(model_file, monitor='val_loss', save_best_only=True, verbose=1))

    return callbacks


def get_best_model(results_pth, eval_metric='val_acc'):
    """ looks through history data for model to determine best model based on eval_metric """

    # todo: update for cases where r may not be limited to 0

    # load history file and extract row for max eval_metric
    df = pd.read_csv(os.path.join(results_pth, 'history.csv'))
    index = df[eval_metric].idxmax()

    # find out which fold index corresponds to
    r = 0
    k = df['k_fold'][index]
    best_model = os.path.join(results_pth, 'model_weights-best_k{0}_r{1}.hdf5'.format(k, r))
    return best_model


def plot_save_training_history(history_file_pth):

    # load csv into data frame
    df_history = pd.read_csv(history_file_pth)

    # create plot and save
    k_fold = np.unique(df_history['k_fold'])
    max_epochs = df_history.iloc[:, 0].max()
    fig, ax_arr = plt.subplots(len(k_fold), 2, sharex=True, figsize=(8, 7))
    val_acc_max = []
    for fold in k_fold:
        ax = ax_arr[fold]
        df_fold = df_history.loc[df_history['k_fold'] == fold]
        epoch = df_fold.iloc[:, 0]
        train_acc = df_fold.loc[:, ['acc']]
        val_acc = df_fold.loc[:, ['val_acc']]
        train_loss = df_fold.loc[:, ['loss']]
        val_loss = df_fold.loc[:, ['val_loss']]
        ax[0].plot(epoch, train_acc, color='blue', label='training')
        ax[0].plot(epoch, val_acc, color='red', label='validation')
        ax[1].plot(epoch, train_loss, color='blue', label='training')
        ax[1].plot(epoch, val_loss, color='red', label='validation')
        # xticks=range(0, max_epochs+1),
        ax[0].set(xlim=[0, max_epochs], ylim=[0.3, 1.0],
                  ylabel='fold {} \n'.format(fold + 1) + 'Accuracy')
        ax[1].set(xlim=[0, max_epochs],
                  ylabel='Loss')
        if fold == 0:
            ax[1].legend()
            ax[0].set(title='accuracy')
            ax[1].set(title='loss')
        if fold == len(k_fold):
            ax[0].set(xlabel='epochs')
            ax[1].set(xlabel='epochs')
        val_acc_max.append(val_acc.values[-1])
    plt.show()
    history_file_fig_pth = history_file_pth.replace('csv', 'png')
    fig.savefig(history_file_fig_pth, bbox_inches='tight', dpi=150)
    print('training accuracy of model (cross-val) = {0:.2f} ({1:.2f})%'.format(np.mean(val_acc_max), np.std(val_acc_max)))

main()