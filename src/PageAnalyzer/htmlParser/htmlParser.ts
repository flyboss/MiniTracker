import {HtmlFileInfo} from './fileInfo/htmlFileInfo'
import * as jsdom from "jsdom";
import { getBiBindData, getInputEventHandlers } from './userInputs';
import { getIfStmts } from './ifStmts';


export function parseHtmlFile(htmlFile: string): HtmlFileInfo {
    const htmlFileInfo = new HtmlFileInfo();
    if (htmlFile === undefined || htmlFile === "") {
        return htmlFileInfo;
    }
    const html = new jsdom.JSDOM(htmlFile);
    const body = html.window.document.body;
    htmlFileInfo.inputs.userInputs = getBiBindData(body);
    htmlFileInfo.inputs.inputEventHandlers = getInputEventHandlers(body);
    htmlFileInfo.ifStmts = getIfStmts(body);
    return htmlFileInfo
}

