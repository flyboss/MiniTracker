# MiniTracker
This repository includes *the source code, the benchmark, the reverse engineering tools and the evaluation results* for 'MiniTracker: Large-Scale Sensitive Information Tracking in Mini Apps'.
--------


## Installation

Install the npm dependencies:

```cmd
MiniTracker >>> npm install
```

## Build

MiniTracker is implemented in Typescript. To build:

```cmd
MiniTracker >>> cd src
MiniTracker\src >>> tsc
```

## Usage

```cmd
MiniTracker >>> cd out
MiniTracker\out >>> node .\miniTracker.js -h
Usage: MiniTracker [options]

Options:
  -V, --version               output the version number
  -p, --platform-type <type>  (wechat or baidu): platform of the mini program (default: "wechat")
  -f, --file-type <type>      (single or all): single page or all pages of the mini program (default: "single")
  -s, --source-path <path>    mini program path(should include version id) (default: "")
  -k, --keep-inter-results    keep intermediate results to files
  -i, --check-implicit-flow   check implicit tainted flow
  -h, --help                  display help for command

```

## Examples

If we want to obtain all leakages in a  WeChat mini program `WeChatExample` and save all intermediate files:

```cmd
MiniTracker\out >>> node .\miniTracker.js -p wechat -f all -s "filepath of WeChatExample" -k
```

If we only want to obtain the leakages of a page in the WeChat mini program `WeChatExample` :

```cmd
MiniTracker\out >>> node .\miniTracker.js -p wechat -f single -s "filepath of WeChatExample" 
```

## Output

MiniTracker outputs the results into the log file `MiniProgramName-MM-DD-HH-mm.log` in logs folder.
The leakages are like this: 

```txt
Potential data leak in \page1\page1.
  - Source     : wx.getSystemInfoSync (alias of wx.getSystemInfoSync)
                 At assignment temp12 = wx.getSystemInfoSync() in $$func1
  - Propagation: wx.getSystemInfoSync --> temp12
                 At assignment temp12 = wx.getSystemInfoSync() in $$func1
  - Propagation: temp12 --> temp13
                 At assignment temp13 = temp12 in $$func1
  - Propagation: temp13 --> info0
                 At assignment info0 = temp13 in $$func1
  - Propagation: info0 --> temp7
                 At assignment temp14 = this.send(info0) in $$func1
  - Propagation: temp7 --> temp5
                 At assignment temp5 = temp7 in $$func2
  - Propagation: temp5 --> temp8
                 At assignment temp8 = temp5 in $$func2
  - Propagation: temp8 --> info1
                 At assignment info1 = temp8 in $$func2
  - Propagation: info1 --> temp10
                 At assignment temp10.data = info1 in $$func3
  - Sink       : wx.request (alias of wx.request)
                 At assignment temp11 = wx.request(temp10) in $$func3
```


# Benchmark

This is an open test suite for evaluating the effectiveness of privacy leakages detection tools specifically for mini programs. The suite can be used to assess both static and dynamic taint analyses, but in particular it contains test cases for interesting static-analysis problems for the mini program specific challenges like correctly modeling mini program's pages, handling util files and adequately processing asynchronous data flows.

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


# Reverse Engineering Tools

## Installation

Install the npm dependencies:
```cmd
ReverseTool >>> npm install
```

## For WeChat Mini Programs

- Download WeChat mini programs to current folder by Android Debug Bridge tool [adb](https://developer.android.com/studio/command-line/adb)
  ```cmd
  ReverseTool\WeChat >>> adb pull /data/data/com.tencent.mm/MicroMsg/{UserHash}/appbrand/pkg/MiniProgram .\ 
  ```
- We use the tool [wxappUnpacker](https://github.com/xuedingmiaojun/wxappUnpacker) to reverse WeChat mini programs.
  ```cmd
  ReverseTool\WeChat >>> node .\wuWxapkg.js -s "MiniProgramName" 
  ```

## For Baidu Mini Programs

- Download Baidu mini programs to current folder by adb
  ```cmd
  ReverseTool\WeChat >>> adb pull by Android Debug Bridge tool .\ 
  ```
- We develop a reverse engineering tool for Baidu mini programs.
  ```cmd
  ReverseTool\Baidu >>> node .\baiduUnpack.js -s "MiniProgramName" 
  ```

# Evaluation and Results

We compare MiniTracker and CodeQL on the benchmark suite and evaluate MiniTracker on large-scale real-world mini apps.
In this section, we first report how to install CodeQL. Then we report results for large-scale analysis.

## 1. CodeQL 

Along with the submission we also provide our query scripts from CodeQL. They are available in `./Evaluation/CodeQL`. We suggest that the query scripts should be executed in Visual Studio Code with CodeQL extensions. The following guide will also focus on using CodeQL with VSCode.

### Installing and Setting Up Environments

We provide two CodeQL querying scripts

- wechat.ql: For WeChat mini-programs
- baidu.ql: For Baidu mini-programs

We now give a brief guide on using these scripts.

#### Installing CodeQL

- [The official document of CodeQL](https://codeql.github.com/docs/)

CodeQL can be installed following these guides.

- [CodeQL CLI](https://codeql.github.com/docs/codeql-cli/)
- [CodeQL extension for Visual Studio Code](https://codeql.github.com/docs/codeql-for-visual-studio-code/)
- We recommend using the [starter workspace](https://codeql.github.com/docs/codeql-for-visual-studio-code/setting-up-codeql-in-visual-studio-code/#using-the-starter-workspace)

#### Setting Up CodeQL for MiniProgram Analysis

Following the official document, after installing CodeQL, the directory for CodeQL should look like this

```markdown
- codeql
  - This is the installation of CodeQL. It should contain codeql.exe
- codeql-repo
  - This is the cloned CodeQL repository
- starter
  - This is the starter workspace
```

- Then open the **starter workspace** with VS Code, and **copy the .ql script into the Quick Query directory**.

#### Preparing source code and database

To run CodeQL on mini-programs, one should prepare a directory like this: a `./code/` directory stores one or more mini-programs to be examined, and an empty `./database/` directory for CodeQL to create databases.

```markdown
- code
  - This directory should be where mini-programs are located, e.g.
  - Alias1
  - Alias2
  - ...
- database
  - This directory should be EMPTY.
```

Then one can directly execute CodeQL scripts from VSCode extensions and perform analysis.

## 2. Large-scale Analysis

Since the total size of leakage reports and test data are for over 40GBs and 400GBs, respectively. We are unable to upload them to the repository due to file size restrictions. Instead, we provide a detailed overview of our analysis results and an example of mini app source code and leakage report. They are available in `./Evaluation/Results`

### Results for Large-Scale Analysis

The `Results` directory is further divided into `Baidu` and `Wechat`, and each directory respectively contains the results of the corresponding host platform. The two directories contain similar files.

- Corresponds to Section 6.1 Real-world mini apps
  - `stats.csv` contains the basic statistics of each mini app, including the name, version, number of subpackages, number of pages and lines of JavaScript code
- Corresponds to Section 6.3 Mini Apps Analysis
  - `return_status.csv` contains the basic analyze result (success, timeout or failure) of MiniTracker. It contains the elapsed time, return code and error (if any) of each analyzed mini app
- Corresponds to Section 6.4 Leakage Report
  - `sources_sinks.csv` contains the total number of source and sink APIs
  - `sourcesink_pairs.csv` contains the number of all source-sink pairs
  - `api2app.json` is a mapping from an API name to a list of mini apps that contain leaks involving this API.
- Corresponds to Section 6.5 Leakage Characteristics Analysis
  - `leak_details` is a directory containing the detail of each leak. There are one or more csv files recording the detailed infomation for each detected leak, including
    - The length of taint flow
    - The number of functions in the flow
    - Whether the flow contains Page Data, App Data or asynchronous data flows
    - Whether the flow contains encapsulated util sources or sinks
    - For Wechat, since there are too many lines of results, we further divide the mini apps into groups of 8000, and store the results for each group in a separate csv file.
  - `app2leaks.csv` contains the number of local (intra-page), global (inter-page) and total leakages of each analyzed mini app.
- Corresponds to Section 6.6 Running Time
  - The detailed running time for each analyzed mini program can be found in `return_stats.csv` (see Sec 6.3)

### Example Source Code and Leakage Report

Due to file size restrictions, we only provide the reverse-engineered source code and the analysis report of one mini app from Baidu and WeChat respectively. They can be found in `./Evaluation/Example`.

- The examples are available in the `Baidu` and `Wechat` directory under `./Evaluation/Example`.
- For each directory
  - There is a directory containing the source code of the example mini app. (e.g. `百果园+_176`，`_176` is the version number)
  - There is a markdown analysis report; the report is generated automatically by MiniTracker (e.g. `百果园+_176-leakages.md`)

