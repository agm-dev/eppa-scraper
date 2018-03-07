exports.catchErrors = function (fn) {
  return function (...params) {
    return fn(...params).catch(function (err) {
      console.error(`[ fn:catchErrors ] ${err.name}: ${err.message}`);
      process.exit();
    });
  };
};