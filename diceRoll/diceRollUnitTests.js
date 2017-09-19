document.addEventListener('DOMContentLoaded', function() {
  runTests(true);
});

function UnitTest(testName, testFunction) {
  return {
    testName: testName,
    testFunction: testFunction,
    report: null,
    result: null,
    passed: false,
    run: function(app) {
      try {
        this.result = this.testFunction(app, this);
        if (this.result === true) {
          this.passed = true;
          return true;
        }
      } catch(err) {
        this.report = 'ERROR: ' + err;
        this.passed = false;
        this.result = false;
      }
    }
  };
}

function CheckCalledListFor(functionName, calledObject) {
  return {
    functionName: functionName,
    calledObject: calledObject,
    placeHolder: function() {
      calledObject[functionName] = true;
    }
  }
}
function placeHolderForAttach(listenerPlaceHolders, app, test) {
  app.context.attach = function(id, event, action) {
    listenerPlaceHolders[id] = {};
    listenerPlaceHolders[id].event = event;
    listenerPlaceHolders[id].action = action;
  };
}
function checkListeners(expectedListenerPlaceHolderKeys, functionName, app, test) {
  var listenerPlaceHolders = {};
  var expectedListenerPlaceHolderKeys = expectedListenerPlaceHolderKeys;
  placeHolderForAttach(listenerPlaceHolders, app, test);
  app[functionName]();
  var listenerPlaceHolderKeys = Object.getOwnPropertyNames(listenerPlaceHolders);
  assert((JSON.stringify(listenerPlaceHolderKeys) === JSON.stringify(expectedListenerPlaceHolderKeys)), 'failed to add listener(s)');
  for (var listenerId in listenerPlaceHolders) {
    assert((listenerPlaceHolders[listenerId].event === 'click'), listenerId + '.event should be "click"');
  }
}

function assert(condition, message) {
  if (!condition) {
    message = message || 'Assertion failed';
    if (typeof Error !== 'undefined') {
      var err = Error.name + ': ' + message;
      throw err;
    }
    throw message;
  } else {
    return 'Assertion passed';
  }
}

function stub() {
  var info = {
    expectedArgs: null,
    args: null,
    called: {
      true: false,
      expectedCount: null,
      count: 0,
      check: function(expectedCount) {
        info.called.expectedCount = expectedCount;
        if (info.called.expectedCount === undefined || info.called.expectedCount === null) {
          return info.called.true;
        } else {
          return (info.called.count === info.called.expectedCount);
        }
      },
    },
  }

  var placeHolder = function() {
    info.called.true = true;
    info.called.count++;
    info.args = arguments;
    info.expectedArgs = function(expectedArgs) {
      info.expectedArgs.args = arguments;
      return (JSON.stringify(info.expectedArgs.args) === JSON.stringify(info.args));
    }
    return true;
  }
  placeHolder.info = info;
  return placeHolder;
}

function testList() {
  return [
    new UnitTest('run()', function(app, test) {
      app.addRollBarListeners = stub();
      app.addCalculatorListeners = stub();
      app.addUserSaveButtonListener = stub();
      app.simulateFirstVisit = stub();
      app.checkMemory = stub();
      app.toggleMenu = stub();
      app.userSaveButtonCheckDisplay = stub();
      app.run();
      assert(app.addRollBarListeners.info.called.check(), 'addRollBarListeners() not called');
      assert(app.addCalculatorListeners.info.called.check(), 'addCalculatorListeners() not called');
      assert(app.addUserSaveButtonListener.info.called.check(), 'addUserSaveButtonListener() not called');
      assert(app.simulateFirstVisit.info.called.check(), 'simulateFirstVisit() not called');
      assert(app.checkMemory.info.called.check(), 'checkMemory() not called');
      assert(app.toggleMenu.info.called.check(), 'toggleMenu() not called');
      assert(app.userSaveButtonCheckDisplay.info.called.check(), 'userSaveButtonCheckDisplay() not called');
      return true;
    }),
    new UnitTest('addCalculatorListeners()', function(app, test) {
      app.addNumberKeyListeners = stub();
      app.addDiceKeyListeners = stub();
      app.addOperatorKeyListeners = stub();
      app.addCalculatorListeners();
      assert(app.addNumberKeyListeners.info.called.check(), 'addNumberKeyListeners() not called');
      assert(app.addDiceKeyListeners.info.called.check(), 'addDiceKeyListeners() not called');
      assert(app.addOperatorKeyListeners.info.called.check(), 'addOperatorKeyListeners() not called');
      return true;
    }),
    new UnitTest('addNumberKeyListeners()', function(app, test) {
      app.context.attach = stub();
      app.keypadPress = stub();
      app.addNumberKeyListeners();
      assert(app.context.attach.info.called, 'context.attach() not called');
      assert(app.context.attach.info.expectedArgs('num9', 'click', app.keypadPress.bind(this, 9)));
      checkListeners(['num0','num1','num2','num3','num4','num5','num6','num7','num8','num9'], 'addNumberKeyListeners', app, test);
      return true;
    }),
    new UnitTest('addDiceKeyListeners()', function(app, test) {
      // checkListeners(app.context.diceNameArray, 'addDiceKeyListeners', app, test);
      // return true;
    }),
    new UnitTest('addOperatorKeyListeners()', function(app, test) {
      // checkListeners(['num+','num-'], 'addOperatorKeyListeners', app, test);
      // return true;
    }),
    new UnitTest('addRollBarListeners()', function(app, test) {
      // checkListeners(['clrBtn','rollBtn','toggleMenuBtn'], 'addRollBarListeners', app, test);
      // return true;
    }),
    new UnitTest('addUserSaveButtonListener()', function(app, test) {
      // checkListeners(['userSaveButton'], 'addUserSaveButtonListener', app, test);
      // return true;
    }),
  ];
}

function runTests(runTF) {
  if (runTF === true) {
    var testArray = testList();

    var passed = true;
    var failedCount = 0;
    var passedCount = 0;
    for (var i = 0; i < testArray.length; i++) {
      var context = new Context(preloadedSaveItems);
      var app = new App(context);
      var test = testArray[i];
      test.run(app, this);
      if (test.passed) {
        passedCount++;
      } else {
        failedCount++;
        passed = false;
      }
      console.log((test.passed ? 'PASSED: ' : 'FAILED: ') + test.testName + ': ' + test.report + ': ' + JSON.stringify(test.result));
    }
    console.log('TEST RUN ' + (passed ? 'PASSED ' : 'FAILED ') + '(Failed: ' + failedCount + '; Passed: ' + passedCount + ')');
  } else {
    return;
  }
}
