# Benchmark

This is an open test suite for evaluating the effectiveness of privacy leakages detection tools specifically for mini programs. The suite can be used to assess both static and dynamic taint analyses, but in particular it contains test cases for interesting static-analysis problems for the mini program specific challenges like correctly modeling mini program's pages, handling util files and adequately processing asynchronous data flows.

[link](https://drive.google.com/file/d/1ZBOk_3Hb4BpKtj1nfcrtA-jIOkqUIY7g/view?usp=drive_link)
## Basic

* **General1** Sync function positive leakage.
* **General2** Sync function negative leakage.
* **General3** Sync function positive leakage with if statement.
* **General4** Sync function positive leakage with if statement.
* **General5** The sensitive information is stored in an object which is sent.
* **General6** The sensitive information is stored in an object, while other property in the object is sent.
* **General7** A simplified real-world mini-app built with third-party frameworks and transpiled into WeChat mini-app. It has more complex structure.
* **General8** A simplified real-world mini-app. The tainted flow passes through multiple functions.
* **General9** A simplified real-world mini-app. The reverse-engineered codes are much different from those of mini-apps made with the official development tool.
* **Scope1** The sensitive data is passed into outer 'info', but the inner 'info' is not sensitive.
* **Scope2** An untainted 'info' is defined in the outer scope. A tainted 'info' is defined in the inner scope the tainted 'info' is sent to the sink.
* **Scope3** A tainted identifier called 'info' is defined in the outer scope. A parameter of function is also called 'info', overwriting the identifier within the function scope. A untainted literal and the tainted 'info' are both sent to the sink.
* **This1** The 'this' in this case points to the parameter object of Page(). We use this to directly call a method of parameter object.
* **This2** The 'this' in this case points to the parameter object of Page(). It is assigned to an identifier 'o', so that it can be referenced from functions in an inner scope.
* **This3** The 'this' in this case points to an object. We use 'this' to call a method of the object.

## Function

* **Alias1** The sensitive data is passed into a alias of the sink function.
* **Alias2** The sensitive data is assigned to attribute of an object.
* **Alias3** The sensitive data is assigned to different name.
* **Alias4** The source and sink function is renamed.
* **Alias5** The source function is renamed into an object.
* **Alias6** The sensitive data is assigned to different names.

## Async

* **Callback1** The sensitive data is directly passed to a callback function.
* **Callback2** The sensitive data is passed to a function, which calls a function by the parameter.
* **Callback3** The sensitive data is passed to a function which includes a sink.
* **Callback4** The sensitive data is obtained by a callback function and is pass to a function, which calls a function by the parameter.
* **Callback5** The sensitive data is passed into some callback, and is passed into another callback function.
* **Promise1**  The sensitive data is wrapped and returned with Promise.
* **Promise2**  The Sensitive data is passed to a Promise. The Promise takes the data using the arguments keyword.
* **Promise3**  The sensitive data is wrapped and returned with Promise and passed through .then() .
* **Promise4**  The sensitive data is passed by promise with then().then().then() .
* **Promise5**  The sensitive data is passed by Promise. The Promise appears in the return statement of a function and .then() is called on the function's return value.

## Module

* **Util1** Encapsulated source/sink api in utils. Wrapper function is exported from utils using the exports.property = exportedObject pattern.
* **Util2** Encapsulated source/sink api in utils. Wrapper function is exported from utils using the module.exports = Object pattern.
* **Util3** Encapsulated source/sink api in utils. Wrapper function is exported from utils using the module.exports = Object pattern with more complicated wrappings.
* **Util4** Encapsulated source/sink API in App().
* **Util5** The required lib util1 in this page is processed by the Babel library functions which will cause the exported methods to be enclosed in the 'default' property of the util lib.
* **Util6** There exists a require chain in this page, with each util file adding a wrapping layer to a source.

## Specific

* **Component1** The sensitive data is obtained and is sent in the component.
* **Component2** The sensitive data is obtained but is not sent in the component.
* **Component3** The page includes a component, which also includes a component, where there is a leakage.
* **Component4** The page includes a component, which also includes a component, where there is no leakage.
* **PageAndGlobalData1** The Sensitive data is stored in page.data, and is sent.
* **PageAndGlobalData2** The sensitive data is assigned to the page data by 'this.setData'.
* **PageAndGlobalData3** The sensitive data is passed into another page using globalData.
* **PageAndGlobalData4** The sensitive data is passed into another page using globalData. A safe page that do not process the globalData also exists.
* **PageAndGlobalData5** A simplified real-world mini-app. Pass value through page data.
* **PageAndGlobalData6** A simplified real-world mini-app. Global Data with advanced API encapsulation
* **PageAndGlobalData7** A simplified real-world mini-app. Pass value through global data.
* **PageAndGlobalData8** The sensitive data is passed into another page using eventChannel.

* **UserInput1** The inputBlur accesses phoneNumber, which is two-way bound to an input in wxml.
* **UserInput2** The bindInput callback is bound to an input with bindInput in wxml.
* **UserInput3** The getPhoneNumber is bounded to a button with Open-Data access in wxml which acquires user's phone number.
* **Cross Mini App1** The Sensitive data is obtained by the sender mini app, and is sent to the page of receiver mini app.
* **Cross Mini App1** The Sensitive data is obtained by the sender mini app, and is sent to the receiver mini app.

## Dynamic

* **Array1** An array is initialized with a tainted value. Only one element in this array is tainted, and the entire array is sent to a sink.
* **Array2** A constant array is initialized with a tainted value and an untainted value. However, only the UNTAINTED value is sent to the sink.
* **Array3** A constant array is initialized with a tainted value and an untainted value. The UNTAINTED value is then accessed by a computed index, and send to a sink.
* **Array4** An array is initialized with a tainted value and an untainted value. A copy of this array is created and sent to a sink.
* **Array5** A tainted value is pushed into an empty array. The array is sent to a sink (leak). Then the taint is popped out of the array, The empty array is then sent to another sink (not a leak).
* **Array6** A constant array is initialized with a tainted value and an untainted value. The array is then traversed and sanitized. The sanitized array is then sent to a sink.
* **Property1** Two identical objects are created, each containint a tainted field and a non-tainted field. The sensitive field of one object and the non-sensitive field of the other object are sent to sinks.
* **Property2** Two identical objects are created, each containing a tainted field and a non-tainted field. The sensitive field of one object and the non-sensitive field of the other object are sent to sinks. The fields are accessed by reflection.
* **Property3** An object contains a tainted field and a non-tainted field. The sensitive field is then computed and accessed by reflection and sanitized. The sanitized field is then sent to a sink.
