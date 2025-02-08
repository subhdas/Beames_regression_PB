import os
import pandas as pd
import random
import numpy as np
import json
import math
from hyperopt import hp, tpe

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from hyperopt import hp, tpe, STATUS_OK, Trials
from hyperopt.fmin import fmin
from sklearn.metrics import classification_report, f1_score, accuracy_score, confusion_matrix, precision_score, recall_score
import json
from sklearn import preprocessing
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, BaggingClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.decomposition import PCA
from sklearn.naive_bayes import GaussianNB, MultinomialNB
import matplotlib.pyplot as plt

import operator
from sklearn.metrics import r2_score, explained_variance_score, mean_squared_error, mean_absolute_error
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, AdaBoostRegressor, StackingRegressor, VotingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.neural_network import MLPRegressor
# from pytorch_regression import RegModel

def wrap_findGoodModel(train, test, targetTrain, targetTest, extraInfo):
    done = False
    it, MAX_TRY = 0, 10
    obj = None
    while(not done and it < MAX_TRY):
        # try: return find_goodModel(train, test, targetTrain, targetTest, extraInfo)
        # except Exception as e:  print (" errored in finding good model ", e)
        return find_goodModel(train, test, targetTrain, targetTest, extraInfo)
        it += 1
    return obj


def preProcessData(data, userFeatures):
    data = data.apply(pd.to_numeric, errors='ignore')
    data = data._get_numeric_data()
    idCol = data['id']
    data = data.drop(['id'], axis=1)
    try:
        data = data.drop(['cluster'], axis=1)
    except:
        pass
    if(userFeatures and len(userFeatures) > 0):
        data = data[userFeatures]
        # data = feature_selection_PCA(data)
    print (" pre processing data col ")

    myCol = data.columns.values
    # SCALE DATA
    # scaler = preprocessing.StandardScaler()
    # scaled_df = scaler.fit_transform(data)
    # data = pd.DataFrame(scaled_df)
    # data.columns = myCol
    # print (" data is ", data.head(3), myCol)
    return data, idCol

def compute_metrics(y_test,y_pred):
    # print metrics of the model
    mean_abs_err = mean_absolute_error(y_test, y_pred)
    mean_sq_err = mean_squared_error(y_test, y_pred)
    rootmean_sq_err = np.sqrt(mean_squared_error(y_test, y_pred)), np.sqrt(mean_squared_error(y_test, y_pred))/len(y_pred.tolist())
    r2score = r2_score(y_test, y_pred, multioutput='variance_weighted')
    exp_var_score = explained_variance_score(y_test, y_pred, multioutput='uniform_average')
    errorlist = [abs(v - y_test.tolist()[i]) for i,v in enumerate(y_pred)]
    index, max_error = max(enumerate(errorlist), key=operator.itemgetter(1))
    print('Mean Absolute Error:', mean_abs_err)
    print('Mean Squared Error:', mean_sq_err)
    print('Root Mean Squared Error:', rootmean_sq_err)
    print('R Squared: ', r2score)
    print('Explained Variance Score: ',  exp_var_score)
    print('Max error: ', max_error, index)
    obj = {}
    obj['index'] = index
    obj['max_error'] = max_error
    obj['r2score'] = r2score
    obj['exp_var_score'] = exp_var_score
    obj['mean_abs_err'] = mean_abs_err
    obj['mean_sq_err'] = mean_sq_err
    obj['rootmean_sq_err'] = rootmean_sq_err
    return obj

def visualize_res(trials):
    f, ax = plt.subplots(1)
    xs = [t['tid'] for t in trials.trials]
    # ys = [t['misc']['vals']['x'] for t in trials.trials]
    ys = [t['result']['loss'] for t in trials.trials]

    # ax.set_xlim(xs[0], xs[-1]+100)
    ax.scatter(xs, ys, s=20, linewidth=0.01, alpha=0.75)
    # ax.line(ys)
    ax.set_title('$x$ $vs$ $t$ ', fontsize=18)
    ax.set_xlabel('$t$', fontsize=16)
    ax.set_ylabel('$x$', fontsize=16)
    plt.show()

    # f, ax = plt.subplots(1)
    # xs = [t['misc']['vals']['x'] for t in trials.trials]
    # ys = [t['result']['loss'] for t in trials.trials]
    # ax.scatter(xs, ys, s=20, linewidth=0.01, alpha=0.75)
    # ax.set_title('$val$ $vs$ $x$ ', fontsize=18)
    # ax.set_xlabel('$x$', fontsize=16)
    # ax.set_ylabel('$val$', fontsize=16)
    # plt.show()

    return

def find_goodModel(train, test, targetTrain, targetTest, extraInfo):
    MAX_EVAL = 500
    # train, trainId = preProcessData(train, userFeatures=None)
    # test, testId = preProcessData(test, userFeatures=None)

    def objective2(space):
        # print ('checking space ', space['sx']['x'])
        x  = space['sx']['x']
        # print ('x is ', x)
        val = (x-1)**2
        return {'loss':  val, 'status': STATUS_OK, 'model': 'clf', 'x_sample': x}

    def objective(space):
        # clf = xgb.XGBRegressor(n_estimators = space['n_estimators'],
        #                        max_depth = space['max_depth'],
        #                        min_child_weight = space['min_child_weight'],
        #                        subsample = space['subsample'],
        #                        learning_rate = space['learning_rate'],
        #                        gamma = space['gamma'],
        #                        colsample_bytree = space['colsample_bytree'],
        #                        objective='reg:linear'
        #                        )
        learngAlg = space['lag']
        spaceR = space['rf']
        spaceN = space['nn']
        spaceB = space['bg']
        spaceNB = space['nb']
        spaceAB = space['ab']
        spaceXGB = space['xgb']
        # print " space is ", space

       
        clf = ''
        # clf = AdaBoostRegressor(DecisionTreeRegressor(max_depth=spaceR['max_depth']),  n_estimators=spaceR['n_estimators'], random_state=np.random.RandomState(1))
        ab = AdaBoostRegressor(DecisionTreeRegressor(max_depth=spaceAB['mx_dep']), learning_rate=spaceAB['lr'],
                                loss=spaceAB['loss'], n_estimators=spaceAB['n_estim'], random_state=np.random.RandomState(1))
        
        # voting regressor
        gb = GradientBoostingRegressor(random_state=1, n_estimators=spaceAB['n_estim'])
        rf = RandomForestRegressor(max_depth=spaceR['max_depth'],
                min_samples_split=spaceR['min_samples_split'],
                min_samples_leaf=spaceR['min_samples_leaf'],
                bootstrap=spaceR['bootstrap'],
                criterion=spaceR['criterion'],
                # criterion='gini',
                random_state=1
            )
        
        # clf = ab
        # clf = VotingRegressor(estimators=[('gb', gb), ('rf', rf), ('ab', ab)])
        clf = xgb.XGBRegressor(objective='reg:squarederror', 
                               colsample_bytree=spaceXGB['coltreex'],
                               learning_rate=spaceXGB['lrx'], 
                               max_depth=spaceXGB['mdx'], 
                               reg_alpha=spaceXGB['alx'],
                            #    min_child_weight=spaceXGB['mcwx'],
                               n_estimators=spaceXGB['nestx'],
                            #    gamma = spaceXGB['gammax'],
                            #    subsample=spaceXGB['subsamx'],
                            #    reg_lambda=spaceXGB['lbx'],
                               nthread = 25)

        # clf = MLPRegressor(
        #     hidden_layer_sizes=(spaceN['hidden_layer_sizes'], ),
        #     activation='relu', #spaceN['activation'],
        #     solver=spaceN['solver'],
        #     alpha=spaceN['alpha'], 
        #     batch_size= spaceN['batch_sz'],
        #     learning_rate=spaceN['learning_rate_N'],
        #     learning_rate_init=spaceN['learning_rate_init'],
        #     power_t=spaceN['powt'],
        #     max_iter= spaceN['max_iter'],
        #     shuffle=True, 
        #     random_state=None, 
        #     tol=0.0001, 
        #     verbose=False, 
        #     warm_start=False, 
        #     momentum=0.9, 
        #     nesterovs_momentum=True,
        #     early_stopping=False, 
        #     validation_fraction=0.1, 
        #     beta_1=0.9, beta_2=0.999, 
        #     epsilon=1e-08, 
        #     n_iter_no_change=10, 
        #     max_fun=15000
        # )

        # below to find new models
        # minV = 0.55
        # if(iteration == 0):
        #     minV = 1
        # if(iteration == 1):
        #     minV = 0.9
        # if(iteration == 2):
        #     minV = 0.78
        # if(iteration == 3):
        #     minV = 0.58
        # toss = random.uniform(0, 1)
        # print ' toss is ', iteration, toss, minV
        # if(toss <= minV):
        #     learngAlg = 0
        #     print " ++++ setting learning alg ", 0

        # if(clf == '' and learngAlg == 0):
        #     model = 'RandomForest'
        #     clf = RandomForestClassifier(max_depth=spaceR['max_depth'],
        #                                  min_samples_split=spaceR['min_samples_split'],
        #                                  min_samples_leaf=spaceR['min_samples_leaf'],
        #                                  bootstrap=spaceR['bootstrap'],
        #                                  #  criterion=space['criterion']
        #                                  criterion='gini',
        #                                  random_state=1
        #                                  )
        # # NEURAL NETWORK CLASSIF -------------------------------------------------------------------------------------
        # if(clf == '' and learngAlg == 1):
        #     model = 'NeuralNetwork'
        #     clf = MLPClassifier(verbose=False, random_state=0, activation=spaceN['activation'], solver=spaceN['solver'], learning_rate_init=spaceN['learning_rate_init'],
        #                         max_iter=spaceN['max_iter'], hidden_layer_sizes=int(spaceN['hidden_layer_sizes']), alpha=spaceN['alpha'], learning_rate='adaptive')


        # # BOOSTING CLASSOIF --------------------------------------------------------------------------------------------
        # if(clf == '' and learngAlg == 2):
        #     model = 'Bagging'
        #     try:
        #         clf = BaggingClassifier(n_estimators=spaceB['n_estimators'], max_samples=spaceB['max_samples'],  # max_features=spaceB['max_features']
        #                                 bootstrap=spaceB['bootstrapB'], bootstrap_features=spaceB['bootstrap_features'], random_state=1)
        #     except:
        #         clf = RandomForestClassifier(max_depth=spaceR['max_depth'],
        #                                      min_samples_split=spaceR['min_samples_split'],
        #                                      min_samples_leaf=spaceR['min_samples_leaf'],
        #                                      bootstrap=spaceR['bootstrap'],
        #                                      #  criterion=space['criterion']
        #                                      criterion='gini',
        #                                      random_state=1
        #                                      )
        # # NAIVE BAYES CLASSIF -------------------------------------------------------------------------------------
        # if(clf == '' and learngAlg == 3):
        #     model = 'NaiveBayes'
        #     clf = MultinomialNB(
        #         alpha=spaceNB['alphaNB'], fit_prior=spaceNB['fit_prior'])

        # # GRADIENT BOOSTING  CLASSIF -------------------------------------------------------------------------------------
        # if(clf == '' and learngAlg == 4):
        #     model = 'Boosting'
        #     clf = GradientBoostingClassifier(
        #         n_estimators=spaceB['n_estimators'], learning_rate=spaceB['learning_rate'], random_state=1)
        # # --------------------------------------------------------------------------------------------------------------
        # if(clf == ''):
        #     model = 'BaggingSimple'
        #     # model = 'NaiveBayesDef'
        #     clf = BaggingClassifier(
        #         n_estimators=spaceB['n_estimators'], random_state=1)  # SIMPLE
        #     # clf = MultinomialNB(
        #     #     alpha=spaceNB['alphaNB'], fit_prior=spaceNB['fit_prior'])
        # print ' train shape is a ', train.shape, learngAlg

        clf.fit(train, targetTrain)


        predTrain = clf.predict(train)
        predTest = clf.predict(test)

        obj = compute_metrics(targetTest, predTest)
        index = obj['index']
        max_error = obj['max_error']
        r2score = obj['r2score']

        scoreFinal = max_error

        result = {'loss': scoreFinal, 'status': STATUS_OK, 'model': clf}
        # print " result is ", result, MAX_EVAL, critScore, sameLabScore, similarityScore
        # print " result is ", result, MAX_EVAL, precTrain, accTrain, f1Train
        # print " result is ", result, MAX_EVAL, len(targetTrainNew), len(targetTrain), len(trainT)
        # print " result is ", result, precTest, precTrain, scoreFinal, checkScore
        print (" result is ",   scoreFinal)
        print ("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
        return result

    col_train = train.columns
    bootStrapArr = [True, False]
    criterionArr = ["mse", "mae"]
    spaceR = {
        # 'max_depth': hp.choice('max_depth', np.arange(10, 30, dtype=int)),
        'max_depth': hp.choice('max_depth', range(5, 30)),
        # 'min_samples_split': hp.choice('min_samples_split', np.arange(8, 15, dtype=int)),
        'min_samples_split': hp.choice('min_samples_split', range(8, 15)),
        # 'min_samples_leaf': hp.choice('min_samples_leaf', np.arange(5, 15, dtype=int)),
        'min_samples_leaf': hp.choice('min_samples_leaf', range(5, 15)),
        'bootstrap': hp.choice('bootstrap', bootStrapArr),
        'criterion': hp.choice('criterion', criterionArr)
    }


    # FOR NEURAL NETWORK ------------------------------------------------------------------------
    frange = [x / 10000.0 for x in range(100, 200, 1)]
    # print " got frange ", frange
    activationArr = ['identity', 'logistic', 'tanh', 'relu']
    # solverArr = ['lbfgs', 'sgd', 'adam']
    solverArr = ['sgd']
    spaceN = {
        'max_iter': hp.choice('max_iter', range(10, 100)),
        'hidden_layer_sizes': hp.choice('hidden_layer_sizes', range(2, 20)),
        'alpha': hp.choice('alpha', frange),
        'learning_rate_init': hp.choice('learning_rate_init', frange),
        'learning_rate_N': hp.choice('learning_rate_N', ['constant', 'invscaling', 'adaptive']),
        'activation': hp.choice('activation', activationArr),
        'solver': hp.choice('solver', solverArr),
        'batch_sz': hp.choice('batch_sz', ['auto', 10, 20, 30, 50]),
        'powt': hp.choice('powt', [x/10 for x in range(1, 10)]),
    }
    #---------------------------------------------------------------------------------------------

    # FOR BOOSTING/BAGGING NETWORK ------------------------------------------------------------------------
    frange = [x / 100.0 for x in range(100, 200, 1)]
    bootStrapArr = [True, False]

    # print " got frange ", frange
    spaceB = {
        'n_estimators': hp.choice('n_estimators', range(10, 100)),
        'max_samples': hp.choice('max_samples', range(40, train.shape[0])),
        'max_features': hp.choice('max_features', range(4, train.shape[1])),
        'learning_rate': hp.choice('learning_rate', frange),
        'bootstrapB': hp.choice('bootstrapB', bootStrapArr),
        'bootstrap_features': hp.choice('bootstrap_features', bootStrapArr)
    }
    #---------------------------------------------------------------------------------------------

    # FOR NAIVE BAYES ------------------------------------------------------------------------
    frange = [x / 100.0 for x in range(10, 100, 1)]
    fit_priorArr = [True, False]

    # print (" got frange ", frange)
    spaceNB = {
        'alphaNB': hp.choice('alphaNB', frange),
        'fit_prior': hp.choice('fit_prior', fit_priorArr),
    }
    #---------------------------------------------------------------------------------------------

    # adaboost
    spaceAB = {
        'n_estim': hp.choice('n_estim', np.arange(800, 1500, dtype=int)),
        'mx_dep': hp.choice('mx_dep', np.arange(100, 500, dtype=int)),
        'loss': hp.choice('loss', ['linear', 'square', 'exponential']),
        'lr': hp.choice('lr', [x/10 for x in range(1, 10)])
    }

    # xgboost
    spaceXGB = {
        'nestx': hp.choice('nestx', np.arange(800, 1500, dtype=int)),
        'mdx': hp.choice('mdx', np.arange(100, 500, dtype=int)),
        # 'loss': hp.choice('loss', ['linear', 'square', 'exponential']),
        'lrx': hp.choice('lrx', [x/10 for x in range(1, 10)]),
        'alx': hp.choice('alx', [x/10 for x in range(1, 10)]),
        'coltreex': hp.choice('coltreex', [x/10 for x in range(1, 10)])
    }
    # spaceXGB = {
    #     'nestx': hp.choice('nestx', np.arange(10, 150, dtype=int)),
    #     'mdx': hp.choice('mdx', np.arange(3, 500, dtype=int)),
    #     'mcwx': hp.choice('mcwx', np.arange(0.1, 2, dtype=int)),
    #     'gammax': hp.choice('gammax', np.arange(0.1, 2, dtype=int)),
    #     'subsamx': hp.choice('subsamx', np.arange(0.5, 0.75, dtype=int)),
    #     'lbx': hp.choice('lbx', np.arange(0.001, 0.99, dtype=int)),
    #     # 'loss': hp.choice('loss', ['linear', 'square', 'exponential']),
    #     'lrx': hp.choice('lrx', [x/10 for x in range(1, 10)]),
    #     'alx': hp.choice('alx', [x/10 for x in range(1, 10)]),
    #     'coltreex': hp.choice('coltreex', [x/10 for x in range(1, 10)])
    # }

    # spaceX for testing
    spaceX = {
        # 'x': hp.choice('x', np.arange(10,1000, dtype=float))
        'x': hp.uniform('x', -5, 5)
    }
    #---------------------------------------------------------------------------------------------
    space = {
        'rf': spaceR,
        'nn': spaceN,
        'bg': spaceB,
        'nb': spaceNB,
        'ab': spaceAB,
        'xgb': spaceXGB,
        'lag':  hp.choice('lag', range(0, 5)),
        'sx': spaceX
    }
    trials = Trials()
    print (" STARTING BEST ---- ", train.shape, test.shape, range(0, 5))
    # best = fmin(fn=objective,
    #             space=space,
    #             algo=tpe.suggest,
    #             max_evals=MAX_EVAL,  # change 3
    #             trials=trials)

    best = fmin(fn=objective,
                space=space,
                algo=tpe.suggest,
                max_evals=MAX_EVAL,  # change 3
                trials=trials)

    print (" best result is ")  , best

    # print " trials are ", trials
    # mod_results = {}

    ind = 0
    loss_arr = [item['result']['loss'] for item in trials.trials]
    loss_arr.sort()

    for trial in trials.trials:
        res = trial['result']
        # los = res['loss']        
        # index = loss_arr.index(los)
        par_space = trial['misc']['vals']
        # print('trails in, loss: ', res)
        # for item in res:
        #     try:
        #         res[item] = -1*res[item]
        #     except Exception as e:
        #         print('some error ignore plz ', e)
        # for item in par_space:
        #     par_space[item] = par_space[item][0]
        # mod_results[index] = {'res': res, 'space': par_space, 'model': mod,
        #                       'modelMetrics': modMetr, 'modName': modName, 'los': los, 'losTest': losTest}
        ind += 1

    visualize_res(trials)
    obj = {
        'params': best,
        'STATUS': 'OK'
    }
    print (" COMPLETED FIND GOOD MODEL +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ")
    return obj



