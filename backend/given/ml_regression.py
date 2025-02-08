from numpy.random import seed
seed(1)
from tensorflow import set_random_seed
set_random_seed(2)

import pandas as pd
import numpy as np
import os
from tensorflow.python.keras import Sequential
from tensorflow.python.keras.layers import Dense
from tensorflow.python.keras import backend
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from tensorflow.python.keras.callbacks import EarlyStopping, ModelCheckpoint
from matplotlib import pyplot as plt
import marker_helper

# todo: run kfold cross validation instead of a single train/test split
# todo: test models with marker data scaled with respect to pelvis to remove coordinate system dependency
# todo: clean up code to allow for easier testing of multiple settings

scriptdir = os.path.dirname(os.path.abspath(__file__))
os.chdir( scriptdir )

import tensorflow as tf
sess = tf.Session(config=tf.ConfigProto(log_device_placement=True))

with tf.device('/gpu:0'):
    a = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[2, 3], name='a')
    b = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[3, 2], name='b')
    c = tf.matmul(a, b)

with tf.Session() as sess:
    print (sess.run(c))

""" module wide constants"""
VALIDATION_SPLIT = 0.2
BATCH_SIZE = 2
VERBOSE = 0
EPOCHS = 4000
RESULTS_FOLDER = os.path.join(os.getcwd(), 'results', 'model_predictions')


def predict_subject_measurements(subject_measurements, predictors, models=['ann_regression'], scale_method=None,
                                 data_set='combined_data.csv'):
    """ main function to perform analyses

    Parameters
    ---------
    subject_measurements : list, Subject measurements to predict
    predictors           : str, Type of predictor. Choices: 'markers', 'distances','markers and distances'
    models               : list (default = 'ann_regression'), Models to run for prediction
    scale_method         : str (default = None), Method to use to scale data

    Notes:
    -----
    - A simple 80/20% split is done with no shuffling of data to allow for easier trouble shooting. Potentially,
      results are 'lucky' based on chosen split. It may be relevant to try multiple different splits (e.g. using kfold)
    """

    # set up folders
    if not os.path.isdir(RESULTS_FOLDER):
        os.mkdir(RESULTS_FOLDER)

    # load data set
    x, x_names, y, y_names, users = load_data(subject_measurements, predictors, data_set)

    # simple train test split
    indices = list(range(len(users)))
    x_train, x_test, y_train, y_test, _, index_test = train_test_split(x, y, indices, test_size=0.2, shuffle=False)
    test_users = users[index_test]

    # scale data
    if scale_method == 'standard':
        sc = StandardScaler()
        x_train = sc.fit_transform(x_train)
        x_test = sc.fit_transform(x_test)

    # perform analysis
    print('running analysis for {}'.format(predictors))
    for model in models:
        df = pd.DataFrame()
        df['Subject Code'] = test_users
        print('for model {0}'.format(model))
        for subject_measurement in subject_measurements:
            y_index = y_names.index(subject_measurement)
            y_train_sm = y_train[:, y_index]
            y_test_sm = y_test[:, y_index]
            y_pred, r, hist, top_feats = model_evaluate(x_train, x_test, y_train_sm, y_test_sm, model, x_names)
            print('\nRME btw true/pred {0}={1:.2f} mm'.format(subject_measurement, r), end=" ")
            if type(top_feats) != list:
                print('Most important features:', end=" ")
                count = 1
                for index, val in top_feats.iteritems():
                    if count > 3:
                        print("")
                        break
                    else:
                        #print('{0} most important feature {1} {2:.2f}%'.format(count, index, 100*val))
                        print(index, end=" ")
                        count += 1

            # write to csv
            df[subject_measurement] = y_pred
            df[str(subject_measurement) + '_error'] = y_test_sm - y_pred
            df.to_csv(os.path.join(RESULTS_FOLDER, 'sm_predict-M_{0}_{1}_{2}_{3}.csv').
                      format(model, data_set, predictors, scale_method), index=False)


def model_evaluate(x_train, x_test, y_train, y_test, model_type, x_names):
    """ evaluate different models"""
    # choose model
    if model_type == 'ann_regression':
        callbacks = model_callbacks()
        model = ann_regressor(n_predictors=x_test.shape[1])
    elif model_type == 'linear_regression':
        model = LinearRegression()
    elif model_type == 'random_forest_regression':
        model = RandomForestRegressor(n_estimators=20,min_samples_leaf=100,min_samples_split=100,max_features=None)
    elif model_type == 'gradient_boosting_regression':
        model = GradientBoostingRegressor()
    elif model_type == 'average':
        model = []

    # fit model
    history = []
    feat_imp_df = []
    if type(model) == Sequential:
        history = model.fit(x_train, y_train, validation_split=VALIDATION_SPLIT, batch_size=BATCH_SIZE, verbose=VERBOSE,
                            epochs=EPOCHS, callbacks=callbacks)
    elif model_type == 'linear_regression':
        model.fit(x_train, y_train)
    elif model_type == 'average':
        pass
    else:
        model.fit(x_train, y_train)
        feat_imp_df = pd.Series(model.feature_importances_, index=x_names)
        feat_imp_df = feat_imp_df.sort_values(axis=0, ascending=False)
        # plot most important features
        # feat_importances.nlargest(20).plot(kind='barh')
        #plt.show()

    # evaluate model
    if model_type == 'average':
        y_pred = np.asarray([np.mean(y_train)] *len(y_test))
    else:
        y_pred = model.predict(x_test)

    if np.ndim(y_pred) == 2:
        y_pred = np.squeeze(y_pred, axis=1)
    rmse = root_mean_squared_error(y_test, y_pred)

    return y_pred, rmse, history, feat_imp_df


def plot_history(history):
    """ plot training history"""
    # plot training history
    plt.plot(history.history['loss'], label='train')
    plt.plot(history.history['val_loss'], label='test')
    plt.legend()
    plt.show()


def load_data(parameters, predictors, data_set='combined_data.csv'):
    """ load csv file and extract relevant columns """
    df = pd.read_csv('./subject_csv/' + data_set)
    if 'Unnamed: 118' in df.columns.values.tolist():
        df = df.drop(labels='Unnamed: 118', axis=1)
    users = df.iloc[:, 0]
    rasi_x_col = df.columns.get_loc('RASI_x')
    y_names = df.columns.values[1:rasi_x_col].tolist()  # dvs: anthro names
    y = df.iloc[:, 1:16].values
    x_names = df.columns.values[16::].tolist()  # ivs: marker names

    # extract predictors based on predictors input
    if predictors == 'markers':             # use markers as predictors
        x = df.iloc[:, 16::].values
    elif predictors == 'distances':         # use distances between marker paris
        df = compute_marker_distances(df, x_names)
        # df = compute_marker_distances3(df, x_names)
        x = df.iloc[:, 16 + len(x_names)::].values
        x_names = df.columns.values[16+len(x_names)::].tolist()
    elif predictors == 'markers and distances':
        x = df.iloc[:, 16::].values
        x_names = df.columns.values[16::].tolist()
    elif predictors == 'lower_limb_distances':
        x_names_lower_limbs = []
        for x_name in x_names:
            if x_name[1:-2] in ['ASI', 'PSI', 'THI', 'KNE', 'TIB', 'ANK', 'HEE', 'TOE']:
                x_names_lower_limbs.append(x_name)
        df = compute_marker_distances(df, x_names_lower_limbs)
        #df = compute_marker_distances3(df, x_names_lower_limbs)
        x = df.iloc[:, 16 + len(x_names)::].values
        x_names = df.columns.values[16 + len(x_names)::].tolist()
    else:
        raise NotImplementedError

    # extract response variable based on parameters
    y_index = [y_names.index(parameter) for parameter in parameters]
    y_names = [y_names[i] for i in y_index]
    y = y[:, y_index]  # dvs: anthro values

    # check shape of x
    if np.ndim(x) == 1:
        x = np.expand_dims(x, axis=1)

    return x, x_names, y, y_names, users


def ann_regressor_baseline():
    """ vanilla ann for testing"""
    model = Sequential()
    model.add(Dense(102, input_dim=102, kernel_initializer='normal', activation='relu'))
    model.add(Dense(1, kernel_initializer='normal'))
    model.compile(loss='mean_squared_error', optimizer='adam')
    return model


def ann_regressor(n_predictors):
    """ improved model based on empirical testing"""
    model = Sequential()
    model.add(Dense(n_predictors*2, input_dim=n_predictors, kernel_initializer='normal', activation='relu'))
    model.add(Dense(64,  kernel_initializer='normal', activation='relu'))
    model.add(Dense(1, kernel_initializer='normal'))
    model.compile(optimizer="rmsprop", loss=root_mean_squared_error_keras)
    return model


def root_mean_squared_error_keras(y_true, y_pred):
    """ custom RMSE so that error remains in same units as inputs"""
    return backend.sqrt(backend.mean(backend.square(y_pred - y_true), axis=-1))


def root_mean_squared_error(y_true, y_pred):
    return np.sqrt(mean_squared_error(y_true, y_pred))


def compute_marker_distances(df, marker_names):
    # compute magnitude of each marker
    marker_mag_names = np.unique([w.split('_')[0] for w in marker_names])
    marker_mag_pairs = all_pairs_from_list(marker_mag_names)
    for marker_mag_pair in marker_mag_pairs:
        marker_pair_name = marker_mag_pair[0] + '_' + marker_mag_pair[1] + '_mag'
        p1x = df[marker_mag_pair[0] +'_x']
        p1y = df[marker_mag_pair[0] +'_y']
        p1z = df[marker_mag_pair[0] +'_z']
        p2x = df[marker_mag_pair[1] + '_x']
        p2y = df[marker_mag_pair[1] + '_y']
        p2z = df[marker_mag_pair[1] + '_z']
        df[marker_pair_name] = np.sqrt((p1x-p2x) ** 2 + (p1y-p2y) ** 2 + (p1z-p2z) ** 2)
    return df


def compute_marker_distances3(df, marker_names):
    # compute magnitude of each marker
    marker_mag_names = np.unique([w.split('_')[0] for w in marker_names])
    
    #marker_mag_pairs = all_pairs_from_list(marker_mag_names)
    marker_mag_pairs = marker_helper.markerCombos(markers = marker_mag_names,n=2) 
    marker_mag_pairs+= marker_helper.markerCombos(markers = marker_mag_names,n=3) 
    
    for marker_mag_pair in marker_mag_pairs:
        if len(marker_mag_pair) == 3:
            marker_pair_name = marker_mag_pair[0] + '_' + marker_mag_pair[1] + '_' + marker_mag_pair[2] + '_mag'
            
            p1x = df[marker_mag_pair[0] +'_x']
            p1y = df[marker_mag_pair[0] +'_y']
            p1z = df[marker_mag_pair[0] +'_z']
            p2x = df[marker_mag_pair[1] + '_x']
            p2y = df[marker_mag_pair[1] + '_y']
            p2z = df[marker_mag_pair[1] + '_z']
            p3x = df[marker_mag_pair[2] + '_x']
            p3y = df[marker_mag_pair[2] + '_y']
            p3z = df[marker_mag_pair[2] + '_z']

            dst1 = np.sqrt((p1x-p2x) ** 2 + (p1y-p2y) ** 2 + (p1z-p2z) ** 2)
            dst2 = np.sqrt((p2x-p3x) ** 2 + (p2y-p3y) ** 2 + (p2z-p3z) ** 2)

            df[marker_pair_name] = dst1+dst2
            
        elif len(marker_mag_pair)==2:
            marker_pair_name = marker_mag_pair[0] + '_' + marker_mag_pair[1] + '_mag'
            
            p1x = df[marker_mag_pair[0] +'_x']
            p1y = df[marker_mag_pair[0] +'_y']
            p1z = df[marker_mag_pair[0] +'_z']
            p2x = df[marker_mag_pair[1] + '_x']
            p2y = df[marker_mag_pair[1] + '_y']
            p2z = df[marker_mag_pair[1] + '_z']

            df[marker_pair_name] = np.sqrt((p1x-p2x) ** 2 + (p1y-p2y) ** 2 + (p1z-p2z) ** 2)

    return df
           
    
def all_pairs_from_list(source_list):
    """compute all possible pairs from elements in a list"""
    result = []
    for p1 in range(len(source_list)):
        for p2 in range(p1 + 1, len(source_list)):
            result.append([source_list[p1], source_list[p2]])
    return result


def model_callbacks(model_file=None, patience=100):
    """ keras callbacks to force an early stop and save best model"""
    callbacks = []
    callbacks.append(EarlyStopping(monitor='val_loss', mode='min', verbose=0, patience=patience))
    if model_file:
        callbacks.append(ModelCheckpoint(model_file, monitor='val_loss', save_best_only=True, verbose=1))
    return callbacks


if __name__ == "__main__":
    import argparse
    parser1 = argparse.ArgumentParser(description='testing different models')
    parser1.add_argument('--test', type=int, default=0, dest='test')
    parser1.add_argument('--data_set', type=str, default='combined_data_relative_smFix.csv')
    args = parser1.parse_args()
    data_set = args.data_set
    test = args.test

    subject_measurements = ['LeftLegLength', 'RightLegLength', 'InterAsisDistance', 'RightKneeWidth',
                            'LeftKneeWidth', 'RightAnkleWidth', 'LeftAnkleWidth']
    
    test = 6
    print(data_set)
    
    if test == 0:
        # test NN using marker data only
        # RME between true / predicted LeftLegLength =45.89 mm
        # RME between true / predicted RightLegLength =29.50 mm
        # RME between true / predicted InterAsisDistance =39.39 mm
        # RME between true / predicted RightKneeWidth =8.04 mm
        # RME between true / predicted LeftKneeWidth =10.11 mm
        # RME between true / predicted RightAnkleWidth =5.75 mm
        # RME between true / predicted LeftAnkleWidth =4.40 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers',
                                     models=['ann_regression'], data_set=data_set)

    elif test == 1:
        # test NN using distance data only
        # RME between true / predicted LeftLegLength =43.72 mm
        # RME between true / predicted RightLegLength =50.38 mm
        # RME between true / predicted InterAsisDistance =39.21 mm
        # RME between true / predicted RightKneeWidth =9.49 mm
        # RME between true / predicted LeftKneeWidth =9.12 mm
        # RME between true / predicted RightAnkleWidth =5.99 mm
        # RME between true / predicted LeftAnkleWidth =4.22 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='distances',
                                     models=['ann_regression'], data_set=data_set)

    elif test == 2:
        # test NN using markers + distance data
        # RMSE between true / predicted LeftLegLength =45.75 mm
        # RMSE between true / predicted RightLegLength =27.41 mm
        # RMSE between true / predicted InterAsisDistance =19.12 mm
        # RMSE between true / predicted RightKneeWidth =8.87 mm
        # RMSE between true / predicted LeftKneeWidth =6.26 mm
        # RMSE between true / predicted RightAnkleWidth =8.27 mm
        # RMSE between true / predicted LeftAnkleWidth =4.37 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers and distances',
                                     models=['ann_regression'], data_set=data_set)

    elif test == 3:
        # test versus basic linear regression
        # RMSE between true / predicted LeftLegLength =193.93 mm
        # RMSE between true / predicted RightLegLength =87.86 mm
        # RMSE between true / predicted InterAsisDistance =27.19 mm
        # RMSE between true / predicted RightKneeWidth =291.62 mm
        # RMSE between true / predicted LeftKneeWidth =372.47 mm
        # RMSE between true / predicted RightAnkleWidth =38.25 mm
        # RMSE between true / predicted LeftAnkleWidth =39.63 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers and distances',
                                     models=['linear_regression'], data_set=data_set)

    elif test == 4:
        # test using random forest regressor for markers and distances
        # RME between true / predicted LeftLegLength =15.59 mm
        # RME between true / predicted RightLegLength =17.21 mm
        # RME between true / predicted InterAsisDistance =17.70 mm
        # RME between true / predicted RightKneeWidth =13.87 mm
        # RME between true / predicted LeftKneeWidth =6.82 mm
        # RME between true / predicted RightAnkleWidth =5.55 mm
        # RME between true / predicted LeftAnkleWidth =7.66 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers and distances',
                                     models=['random_forest_regression'], data_set=data_set)

    elif test == 5:
        # test effect of scaling
        # RME between true / predicted LeftLegLength =16.65 mm
        # RME between true / predicted RightLegLength =15.68 mm
        # RME between true / predicted InterAsisDistance =18.23 mm
        # RME between true / predicted RightKneeWidth =15.90 mm
        # RME between true / predicted LeftKneeWidth =8.60 mm
        # RME between true / predicted RightAnkleWidth =5.41 mm
        # RME between true / predicted LeftAnkleWidth =5.10 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers and distances',
                                     models=['random_forest_regression'], scale_method='standard', data_set=data_set)

    elif test == 6:
        # random forest with lower-limb distances only
        # RME btw true / pred LeftLeg=15.30 mm Most important features: LASI_LTOE_mag RASI_RTOE_mag RANK_RASI_mag
        # RME btw true / pred RightLeg=13.38 mm Most important features: LANK_RASI_mag RASI_RTOE_mag LASI_LTOE_mag
        # RME btw true / pred InterAsisDistance = 5.91 mm Most important features: LASI_RASI_mag LASI_RPSI_mag LHEE_RANK_mag
        # RME btw true / pred RightKneeWidth = 13.42 mm Most important features: RKNE_RTIB_mag LTHI_RTHI_mag LASI_RANK_mag
        # RME btw true / pred LeftKneeWidth = 14.98 mm Most important features: RASI_RTIB_mag RKNE_RTIB_mag LTHI_RTHI_mag
        # RME btw true / pred RightAnkleWidth = 5.64 mm Most important features: RASI_RPSI_mag LTHI_RKNE_mag LASI_RHEE_mag
        # RME btw true / pred LeftAnkleWidth = 5.29 mm Most important features: RHEE_RKNE_mag RASI_RPSI_mag LASI_LPSI_mag
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='lower_limb_distances',
                                     models=['random_forest_regression'], scale_method='standard', data_set=data_set)

    elif test == 7:
        # random forest with distances between markers only
        # RME btw true / pred LeftLeg=17.90 mm Most important features: LASI_LTOE_mag LANK_LASI_mag RANK_RASI_mag
        # RME btw true / pred RightLeg=14.73 mm Most important features: LANK_RASI_mag RASI_RTOE_mag LASI_LTOE_mag
        # RME btw true / pred InterAsisDistance = 5.84 mm Most important features: LASI_RASI_mag LASI_RPSI_mag LTIB_LTOE_mag
        # RME btw true / pred RightKneeWidth = 8.79 mm Most important features: LTHI_RTHI_mag RKNE_RTIB_mag LBHD_RFHD_mag
        # RME btw true / pred LeftKneeWidth = 8.67 mm Most important features: LTHI_RTHI_mag RASI_RTIB_mag C7_T10_mag
        # RME btw true / pred RightAnkleWidth = 5.57 mm Most important features: C7_LELB_mag LPSI_RASI_mag LTHI_RKNE_mag
        # RME btw true / pred LeftAnkleWidth = 4.68 mm Most important features: LASI_LPSI_mag LWRA_LWRB_mag LPSI_RASI_mag
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='distances',
                                     models=['random_forest_regression'], scale_method='standard', data_set=data_set)

    elif test == 8:
        # gradient booster model with distances between markers only
        # RME btw true/pred LeftLegLength=18.04 mm Most important features: RASI_RHEE_mag RASI_RTOE_mag RANK_RASI_mag
        # RME btw true/pred RightLegLength=13.48 mm Most important features: RASI_RTOE_mag RASI_RHEE_mag LASI_LTOE_mag
        # RME btw true/pred InterAsisDistance=3.76 mm Most important features: LASI_RASI_mag LTIB_RTIB_mag RSHO_STRN_mag
        # RME btw true/pred RightKneeWidth=8.93 mm Most important features: RKNE_RTIB_mag LPSI_STRN_mag LTHI_RTHI_mag
        # RME btw true/pred LeftKneeWidth=8.46 mm Most important features: RKNE_RTIB_mag LPSI_STRN_mag LTHI_RTHI_mag
        # RME btw true/pred RightAnkleWidth=5.95 mm Most important features: LASI_LPSI_mag RASI_RPSI_mag LKNE_RTOE_mag
        # RME btw true/pred LeftAnkleWidth=4.56 mm Most important features: RASI_RPSI_mag LASI_LPSI_mag LSHO_RPSI_mag
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='distances',
                                     models=['gradient_boosting_regression'], scale_method='standard', data_set=data_set)
    elif test == 9:
        # test a model that simply guesses the average
        # RME between true / predicted LeftLegLength =46.52 mm
        # RME between true / predicted RightLegLength =47.51 mm
        # RME between true / predicted InterAsisDistance =38.23 mm
        # RME between true / predicted RightKneeWidth =6.70 mm
        # RME between true / predicted LeftKneeWidth =6.66 mm
        # RME between true / predicted RightAnkleWidth =6.85 mm
        # RME between true / predicted LeftAnkleWidth =6.43 mm
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers and distances',
                                     models=['average'], data_set=data_set)

    elif test == 10:
        # test three models using distance of all markers!
        models = ['average', 'gradient_boosting_regression', 'random_forest_regression', 'ann_regression']
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='distances',
                                     models=models, data_set=data_set)

    elif test == 11:
        # test RF using markers only
        models = ['gradient_boosting_regression', 'random_forest_regression']
        predict_subject_measurements(subject_measurements=subject_measurements, predictors='markers',
                                     models=models, data_set=data_set)

    # todo: output predictions by model for all test subjects to csv

