import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as seabornInstance
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, AdaBoostRegressor, StackingRegressor, VotingRegressor
from sklearn import metrics
from sklearn.feature_selection import VarianceThreshold
from sklearn.feature_selection import SelectKBest
from sklearn.feature_selection import chi2
from sklearn.feature_selection import SelectFromModel, RFE
from sklearn.svm import LinearSVC
from sklearn.svm import SVC
from sklearn import preprocessing
from sklearn.metrics import r2_score, explained_variance_score
import operator
from sklearn.model_selection import RandomizedSearchCV, GridSearchCV
import scipy.stats as stats
from sklearn.utils.fixes import loguniform
from hyperopt_model import wrap_findGoodModel
from hyperopt_model import compute_metrics
from scipy.stats.stats import pearsonr
from pytorch_regression import call_reg_internal

def read_csv(filepath = None):
    if(filepath is None): return
    return pd.read_csv(filepath)

def scale_data(df=None):
    if(df is None): return
    mm_scaler = preprocessing.MinMaxScaler()
    df = mm_scaler.fit_transform(df)
    # mm_scaler.transform(X_test)
    df = pd.DataFrame(df)
    return df


def feature_sel(df=None,y=None):
    if(df is None or y is None): return

    # remove features with low variance
    # v = 0.999 #0.8
    # sel = VarianceThreshold(threshold=(v * (1 - v)))
    # df = sel.fit_transform(df)

    # best features by univariate statistical tests
    df = SelectKBest(chi2, k=100).fit_transform(df, y)
    df = pd.DataFrame(df)

    # select from model
    # lsvc = LinearSVC(C=0.01, penalty="l1", dual=False).fit(df, y)
    # model = SelectFromModel(lsvc, prefit=True)
    # df = model.transform(df)

    # recursive featue elimination
    # svc = SVC(kernel="linear", C=1)
    # rfe = RFE(estimator=svc, n_features_to_select=1, step=1)
    # df = rfe.fit_transform(df, y)
    return df

def vis_bar(df):
    df.plot(kind='bar', figsize=(7, 4))
    plt.grid(which='major', linestyle='-', linewidth='0.5', color='green')
    plt.grid(which='minor', linestyle=':', linewidth='0.5', color='black')
    plt.show()


def correlation_based_feat_sel(df, df_target):
    collist = df.columns.values
    colsel = []
    thresh = 0.02
    for i,v in enumerate(collist):
        corr = pearsonr(df[v].tolist(), df_target.tolist())
        print ('correlation btwn ', v, corr)
        if(abs(corr[0]) > thresh): colsel.append(v)
    print ('found good cols ', colsel, len(colsel))

    varlist = []
    for i,v in enumerate(colsel):
        var = np.var(df[v].tolist())
        print (' for variance -- ', v, var)
        varlist.append(var)
    maxvar = max(varlist)
    colselnew = []
    thresh = 0.65
    for i, v in enumerate(colsel):
        if(varlist[i]/maxvar > thresh): colselnew.append(v)
    colsel = colselnew
    print('final good cols ', colsel, len(colsel))
    return colsel


def data_clean(df, targetcol, removecollist):
    df = df.fillna(0)
    df = df._get_numeric_data()
    df['id'] = [x for x in range(df.shape[0])]
    print('df shape ', df.shape)
    y = df[targetcol]
    X = df.drop(removecollist, axis=1)
    # collen = len(X.columns.values)
    # colnum = int(0.5*collen)
    # print('X cols now ', collen, colnum)
    # X = X.ix[:, 0:colnum]
    # print ('col used ', X.columns.values)
    return X,y

def get_data(filepath='./../01_DATA/combined_data_relative.csv', targetcol = None):
    if(filepath is None or targetcol is None): return
    # df = read_csv(filepath='./../01_DATA/combined_data_relative.csv')
    df_tr = read_csv(filepath='./../01_DATA/combined_data_relative_TRAIN.csv')
    df_tt = read_csv(filepath='./../01_DATA/combined_data_relative_TEST.csv')
    # removecollist = ['Subject Code', 'LeftLegLength', 'RightLegLength', 'InterAsisDistance', 'RightKneeWidth', 'LeftKneeWidth', 'RightAnkleWidth', \
    removecollist = ['LeftLegLength', 'RightLegLength', 'InterAsisDistance', 'RightKneeWidth', 'LeftKneeWidth', 'RightAnkleWidth', \
        'LeftAnkleWidth', 'RightShoulderOffset', 'LeftShoulderOffset', 'RightElbowWidth', 'LeftElbowWidth', \
        'RightWristWidth', 'LeftWristWidth', 'RightHandThickness', 'LeftHandThickness']
    # print(df.head(3))

    X_train, y_train = data_clean(df_tr, targetcol, removecollist)
    X_test, y_test = data_clean(df_tt, targetcol, removecollist)

    feat = correlation_based_feat_sel(X_train, y_train)
    X_train = X_train[feat]
    X_test = X_test[feat]

    
    # print('orig data subject ids ', X['Subject Code'].tolist())

    # X_train = X.ix[0:num]
    # X_test = X.ix[num:99]
    # y_train = y.ix[0:num]
    # y_test = y.ix[num:99]

    # print('X and Y shapes ', X.shape, y.shape)
    # X = scale_data(X)
    # X = feature_sel(X,y)
    # print ('after scaling \n', X.head(15))
    # print('X after feature sel ', X.shape)
    #split the data
    # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
    # num = 77
    # X_train = X.ix[0:num]
    # X_test = X.ix[num:99]
    # y_train = y.ix[0:num]
    # y_test = y.ix[num:99]

    xtestdf = pd.DataFrame(X_test)

    print('train test shapes ', X_train.shape, X_test.shape, y_test.shape)
    print('test data subject ids ', xtestdf.index.tolist())
    # print('test data subject ids ', X_test['Subject Code'].tolist())
    return X_train, X_test, y_train, y_test


def build_regression(filepath='./../01_DATA/combined_data_relative.csv', targetcol='LeftKneeWidth'):
    # df = read_csv(filepath)
    if(targetcol is None):
        targetcol = 'LeftLegLength'  # LeftKneeWidth
    X_train, X_test, y_train, y_test = get_data(filepath,targetcol)

    # train the model
    # regressor = LinearRegression()  
    # regressor = DecisionTreeRegressor(max_depth=3)
    ab = AdaBoostRegressor(DecisionTreeRegressor(max_depth=50), learning_rate=0.65, loss='linear', n_estimators=1000, random_state=np.random.RandomState(1))
    gb = GradientBoostingRegressor(random_state=1, n_estimators=1000)
    rf = RandomForestRegressor(random_state=1, n_estimators=1000)

    rf = RandomForestRegressor(n_estimators=100, 
    criterion='mse', max_depth=None, min_samples_split=2, min_samples_leaf=1, min_weight_fraction_leaf=0.0, 
    max_features='auto', max_leaf_nodes=None, min_impurity_decrease=0.0, min_impurity_split=None, 
    bootstrap=True, oob_score=False, n_jobs=None, random_state=None, verbose=0, warm_start=False, ccp_alpha=0.0, max_samples=None)

    estimators = [('gb', gb),
                    ('rf', rf),
                    ('ab', ab)]
    # regressor = StackingRegressor(estimators=estima   tors, final_estimator=GradientBoostingRegressor(random_state=42))
    regressor = VotingRegressor(estimators=[('gb', gb), ('rf', rf), ('ab', ab)])
    # regressor = ab
    print([x/10 for x in range(1, 10)])

    # try random search CV
    # random forest
    param_dist = {
                'max_depth': range(900,2000), #np.arange(5, 100, dtype = int),
                # 'max_depth': stats.uniform(0, 1),
                'n_estimators': np.arange(800, 1500, dtype=int),
                'min_samples_split': range(2,8),
                'min_samples_leaf': range(1,4),
                'max_features': range(5,50),
                'loss': ['linear', 'square', 'exponential'],
                # 'learning_rate': [x/10 for x in range(1,10)]
                }

    # adaboost
    param_dist = {
        'n_estimators': np.arange(800, 1500, dtype=int),
        'loss': ['linear', 'square', 'exponential'],
        'learning_rate': [x/10 for x in range(1,10)]
    }

    # regressor = RandomizedSearchCV(regressor, param_distributions=param_dist, n_iter=1)

    regressor.fit(X_train, y_train) 

    #To retrieve the intercept:
    try:
        print('intercept ', regressor.intercept_)
        print(' coeff ' , regressor.coef_)
    except Exception as e: print (' exception ', e)
    # predict test data
    y_pred_train = regressor.predict(X_train)
    y_pred_test = regressor.predict(X_test)

    df_comp = pd.DataFrame({'Actual': y_test.tolist(),
                            'Predicted': y_pred_test.tolist()})

    df_comp['error'] = abs(df_comp['Actual'] - df_comp['Predicted'])
    # index, max_error = max(enumerate(df_comp['error']), key=operator.itemgetter(1))

    df_comp.to_csv('./../01_DATA/predicted_output_'+targetcol+'.csv')

    print ('predicetd check ', df_comp.head(50))

    # visualize the results 
    vis_bar(df_comp)
    obj = compute_metrics(y_test, y_pred_test)
    index = obj['index']
    max_error = obj['max_error']
    r2score = obj['r2score']

    return (targetcol, max_error, index)


# GLOBAL VARS +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
targetcol_list = ['LeftLegLength','RightLegLength','InterAsisDistance','RightKneeWidth','LeftKneeWidth','RightAnkleWidth','LeftAnkleWidth','RightShoulderOffset', \
    	'LeftShoulderOffset','RightElbowWidth','LeftElbowWidth','RightWristWidth','LeftWristWidth','RightHandThickness','LeftHandThickness']

targetcol_list = targetcol_list[0:3]
targetcol_list = ['LeftLegLength']
targetcol_list = ['LeftAnkleWidth']  
targetcol_list = ['LeftKneeWidth']

def call_regression_modeler():
    index_list, error_list = [],[]
    path = './../01_DATA/combined_data_relative.csv'
    for i,v in enumerate(targetcol_list):
        (targetcol, max_error, index)  = build_regression(path, v)
        index_list.append(index)
        error_list.append(max_error)
        print ('finished modeling for ', i, v, '\n +++++++++++++++++++++++++++++++++++++++++++++++++')

    df_final = pd.DataFrame({'TargetCol': targetcol_list,
                            'Max_error': error_list,
                            'Index': index_list})

    df_final.to_csv('./../01_DATA/outputall_targetcol.csv')

def call_hyperopt_solver():
    index_list, error_list = [], []
    path = './../01_DATA/combined_data_relative.csv'
    X_train, X_test, y_train, y_test = get_data(path, targetcol_list[0])
    obj = wrap_findGoodModel(X_train, X_test, y_train, y_test, {})
    return


def call_pytorch_model(filepath='./../01_DATA/combined_data_relative.csv', targetcol=None):
    if(targetcol is None):
        targetcol = 'LeftLegLength'  # LeftKneeWidth
    X_train, X_test, y_train, y_test = get_data(filepath, targetcol)
    call_reg_internal(X_train.to_numpy(), y_train.to_numpy())



# CALL FUNCS ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# use random search 
# call_regression_modeler()

# use hyperopt
# call_hyperopt_solver()

# use pytorch
call_pytorch_model()

