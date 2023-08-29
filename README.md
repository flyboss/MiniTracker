# MiniTracker

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

## Config
- [config.json5](config/config.json5) defines the config options.
- The configuration about sources and sinks is a JSON formatted file, which includes two fields: sources and sinks. You can configure it as needed. For examples, please refer to [WeChatSourcesAndSinks.json](config/WeChatSourcesAndSinks.json) and [BaiduSourcesAndSinks.json](config/BaiduSourcesAndSinks.json).

# Benchmark
Please see Benchmark folder.


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

# Evaluation

We compare MiniTracker with CodeQL and [TaintMini](https://github.com/OSUSecLab/TaintMini) on the benchmark suite.

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

## 2. TaintMini
We use its default configuration.   


# Citation
If you find MiniTracker useful, please consider citing our paper:

```
@article{li2023minitracker,
  title={MiniTracker: Large-Scale Sensitive Information Tracking in Mini Apps},
  author={Li, Wei and Yang, Borui and Ye, Hangyu and Xiang, Liyao and Tao, Qingxiao and Wang, Xinbing and Zhou, Chenghu},
  journal={IEEE Transactions on Dependable and Secure Computing},
  year={2023},
  publisher={IEEE}
}
```

