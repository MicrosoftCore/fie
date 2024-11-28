/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
const co = require('co');
const pkg = require('./package.json');

// import co from 'co';
// import pkg from './package.json';


const context = {
  api: {
    somefunc() {
      console.log('API Function called');
    },
  },
};

function fieModule(name) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        build() {
          console.log(`excute build function: ${name}`);
        }
      });
    }, 1000);
  });
}

function fieModulePackage(name) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...pkg,
        bb: name
      });
    }, 1000);
  });
}

function getFieModule(name, cb) {
  return new Promise((resolve, reject) => {
    co(function* () {
      const mod = yield fieModule(name);
      const options = yield fieModulePackage(`${name}/package.json`);
      typeof cb === 'function' && cb(null, mod, options);
      resolve({
        mod,
        options,
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

function* step1(context) {
  console.log('Step1: Processing...');
  yield { message: 'Step1 completed', ...context };
}

function* step2(mod, options) {
  console.log('Step2: Creating dynamic callback...');
  console.log(mod, options);
}

// function* thunk(context) {
//   const dynamicCallback = yield* step2(context); // 获取动态回调生成器
//   return dynamicCallback;
// }


function* createThunk(context) {
  yield* [function (thunk) {
    console.log(thunk);
    console.log(context);
    // thunk 为 co 中 thunkToPromise 传入的 callback  (err, res)=> void
    return thunk;
  }];
}

function* start() {
  yield* gens.apply(null, arguments)
}

function* apply(fn, args) {
  try {
    // handle it simply and assume that all results are yieldable
    return yield* fn.apply(null, args)
  } catch {
    // it's also work will resolved promise status here, but it's better to reject the error if handled result properly
    return Promise.resolve()
  }
}

function* gens() {
  yield apply(step2, yield* apply(thunkify, arguments))
}

function* thunkify(...args) {
  return yield function thunk(callback) {
    // returns an object or a promise
    // automated script will handle it
    return co.wrap(apply)(callback, args)
  }
}

function* bb() {
  // yield step1(context);

  // const thunk = yield* createThunk(context);

  // 使用抽象的 wrappedCallback 传递给 getFieModule
  const func = apply(mm, arguments)
  // yield func
  yield getFieModule('somePackageName', function callback() {
    console.log(arguments);
    co(createThunk, context).then((thunk) => {
      // 这里拿到 createThunk yield 的 thunk: (err, res) => void，
      // callback 的 arguments 为getFieModule 传入的(null, mod, options)
      // 这里正好将 arguments传递给 thunk
      console.log(thunk);
      thunk.apply(null, arguments); // 这里将调用 co 的 thunkToPromise中的 resolve，因为第一个参数为null, 所以只剩下 mod, options被返回
    });
  });
}

function* mm() {
  return async function () {
    await co(start, ...arguments, context)
  }
}

// co(bb).then((result) => {
//   console.log(result);
// }).catch((err) => {
//   console.log(err);
// });

co(createThunk).then((resp) => {
  console.log('resp>>', resp);
});
