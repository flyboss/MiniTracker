import { HtmlIfStmt } from "./ifStmt";
import { HtmlUserInputs } from "./htmlUserInput";

export class HtmlFileInfo {
    inputs: HtmlUserInputs;
    ifStmts: Array<HtmlIfStmt>;

    constructor() {
        this.inputs = new HtmlUserInputs();
        this.ifStmts = new Array<HtmlIfStmt>();
    }
}
