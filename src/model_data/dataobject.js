/*
CLASS LOADS A CSV FILE AND PREPS COLS INFO ===========================================================================================================
*/
class DataStore {

  constructor(path, tarcol) {
    this.csvpath = path
    this.targetcol = tarcol
    this.data = null
    this.colinfo = {}
    this.maxsize = 3000
    this.setlabelencode = true
  }


  async data_operations() {
    const data = await this.load_data()
      .then((data) => {
        // console.log('data store ', data)
        if (data.length > this.maxsize) {
          data = data.splice(0, this.maxsize)
          // console.log('data store resized ', data)
        }
        this.data = data
        this.data.columns = Object.keys(data[0])
        this.columns = Object.keys(data[0])
        if (this.setlabelencode) this.convertcateg_bylabelencode(this.data)
        this.get_col_info()
        return data
      })
      .catch(error => {
        // console.error('data in store is rejected : ' + error.message);
      })
    // console.log(' +++++++++++++++++++++++++++++++++ DATA IN STORE ', data)
  }


  get_categoricalcolnames(data) {
    let col = Object.keys(data[0]).map((d, i) => {
      if (isNaN(+data[0][d])) return d
    }).filter((d) => typeof d !== 'undefined')
    return col
  }


  convertcateg_bylabelencode(data) {
    let catcols = this.get_categoricalcolnames(data)
    let colencoded = {}
    Object.keys(data[0]).forEach((d, i) => {
      if (catcols.indexOf(d) != -1) {
        let cols = this.get_column(data, d)
        colencoded[d] = this.label_encode(cols)
      }
    });
    data.forEach((row, i) => {
      Object.keys(row).forEach((d, j) => {
        if (catcols.indexOf(d) != -1) row[d] = colencoded[d][i]
      });
    });
    // console.log('DATA LABEL ENCODED NOW : ', data)
    this.data = data;
  }


  // load the csv data
  load_data() {
    // console.log('checking data what is ', Papa)
    return new Promise(resolve => {
      Papa.parse(this.csvpath, {
        header: true,
        dynamicTyping: true,
        // delimiter: ","
        download: true,
        complete: function (results) {
          // console.log('data recovered ', results)
          resolve(results.data)
        }
      });
    });
  }

  get_col_info() {
    let data = this.data,
      cols = data.columns,
      maincol = this.get_column(data, this.targetcol)
    maincol = Array.from(maincol, x => isNaN(+x) ? x : +x)
    cols.forEach(col => {
      let colarr = this.get_column(data, col);
      colarr = Array.from(colarr, x => isNaN(+x) ? x : +x)
      colarr = colarr.map((c) => typeof c === 'undefined' ? 0 : c)
      this.colinfo[col] = {}
      this.colinfo[col]['variance'] = this.find_variance(colarr)
      this.colinfo[col]['dtype'] = this.get_col_dtype(colarr)
      this.colinfo[col]['uniquevals'] = this.get_uniquevals(colarr)
      this.colinfo[col]['corr_target'] = Math.abs(this.find_corr(colarr, maincol)) // for now added abs
      this.colinfo[col]['corr_matrix'] = {}
    });

    // following can be optimized further
    // to compute correlation matrix
    cols.forEach(col => {
      let colarr = this.get_column(data, col);
      colarr = Array.from(colarr, x => isNaN(+x) ? x : +x)
      cols.forEach(othercol => {
        let othercolarr = this.get_column(data, othercol);
        othercolarr = Array.from(othercolarr, x => isNaN(+x) ? x : +x)
        this.colinfo[col]['corr_matrix'][othercol] = this.find_corr(colarr, othercolarr)
      });
    });
    // console.log('after col info ', this.data)
  }

  shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  find_closest_frmarr(arr, goal) {
    var closest = arr.reduce(function (prev, curr) {
      return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    });
    return closest
  }

  get_uniquevals(col) {
    return [...new Set(col)]
  }

  get_sortarr_indices(arr, ascending = true) {
    var indices = new Array(arr.length);
    for (var i = 0; i < arr.length; ++i) indices[i] = i;
    indices.sort(function (a, b) {
      if (ascending) return arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0;
      else return arr[a] > arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0;
    });
    return indices
  }

  get_column(data, colname, size = -1) {
    if (size == -1) size = data.length
    data = data.slice(0, size)
    return data.map((item, i) => item[colname]);
  }


  get_topcolumns(numtopcols = 3, varname = 'corr_target', categorical = false) {
    let data = this.data,
      colinfo = this.colinfo
    let collist = Object.keys(colinfo);
    collist = collist.filter(c => c != this.targetcol)
    collist = collist.filter(c => p5D.colremove.indexOf(c) === -1)
    collist.sort((a, b) => colinfo[b][varname] - colinfo[a][varname])
    collist.forEach((item, i) => {
      // console.log('+++++ cols with cor target ', item, colinfo[item][varname]);
    });
    // console.log('collist before ', collist)
    if (!categorical) collist = collist.filter((c) => colinfo[c].dtype != 'categorical')
    // console.log(' cols requested ', collist, colinfo)
    return collist.slice(0, numtopcols)
  }

  label_encode(arr) {
    let arrobj = {},
      count = 0,
      arrlabel = []
    arr.forEach(el => {
      if (!arrobj[el]) {
        arrobj[el] = count
        count++
      }
      arrlabel.push(arrobj[el])
    });
    return arrlabel
  }

  get_col_dtype(arr) {
    let dt = 'quantitative'
    if (isNaN(+arr[0])) dt = 'categorical'
    return dt
  }

  find_variance(arr) {
    if (isNaN(+arr[0])) arr = this.label_encode(arr);
    return jStat.variance(arr)
  }

  find_corr(arr1, arr2) {
    if (isNaN(arr1[0])) arr1 = this.label_encode(arr1);
    if (isNaN(arr2[0])) arr2 = this.label_encode(arr2);
    let corr = jStat.corrcoeff(arr1, arr2)
    // console.log('arr1 and arr2 ', arr1, arr2, corr)
    return corr
  }

  find_residual_avg(arr){
    if(arr.length == 0) return null
    let sum = arr.reduce((a, b) => a + b, 0)
    return (sum)/arr.length
  }


  find_rmse(x,y){
    return Math.sqrt(jStat.meansqerr(x,y))
  }


  find_rmse_self(arr){
    let newarr = arr.map(f => f*f)
    let sum = newarr.reduce((a, b) => a + b, 0)
    return Math.sqrt(sum/arr.length)
  }


  find_maxerror(arr){
    return max(arr)
  }


  find_r2squared(x, y) {
    let sum_x = 0,
      sum_y = 0,
      sum_xy = 0,
      sum_xx = 0,
      sum_yy = 0,
      n = x.length
    for (var i = 0; i < n; i++) {

      sum_x += x[i];
      sum_y += y[i];
      sum_xy += (x[i] * y[i]);
      sum_xx += (x[i] * x[i]);
      sum_yy += (y[i] * y[i]);
    }

    let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    let intercept = (sum_y - slope * sum_x) / n;
    let r2sq = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);
    return {
      slope: slope,
      intercept: intercept,
      r2sq: r2sq
    }
  }
}