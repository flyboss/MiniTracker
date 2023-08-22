// IfStmt
// condition -> string
// consequence -> Array<string>
// alternate -> IfStmt | Array<string>
// hasElif -> bool

export class HtmlIfStmt {
    condition: string;
    consequence: Array<string>;
    hasElif: boolean;
    alternate: HtmlIfStmt | Array<string>;

    constructor(condition: string) {
      this.condition = condition;
      this.consequence = new Array<string>();
      this.alternate = new Array<string>();
      this.hasElif = false;
    }

    public _convert(): Array<string> {
      let stringBuilder = new Array<string>();
      stringBuilder.push(`if (${this.condition}) {\n`);
      for (let consequence of this.consequence) {
        stringBuilder.push("__PageParameter__." + consequence + "();\n");
      }
      stringBuilder.push("}");
      if (this.hasElif) {
        stringBuilder.push(" else ");
        let elseStringBuilder = (<HtmlIfStmt>this.alternate)._convert();
        stringBuilder = stringBuilder.concat(elseStringBuilder);
      } else if ((<Array<string>>this.alternate).length) {
        stringBuilder.push(" else {\n");
        for (let alternate of <Array<string>>this.alternate) {
          stringBuilder.push("__PageParameter__." + alternate + "();\n");
        }
        stringBuilder.push("}");
      }
      return stringBuilder;
    }

    public toJSCode(): string {
      return this._convert().join("");
    }

    public getHandlers(): Array<string> {
      let calls = new Array<string>();
      calls = calls.concat(this.consequence);
      if (this.hasElif) {
        calls = calls.concat((<HtmlIfStmt>this.alternate).getHandlers());
      } else {
        calls = calls.concat(<Array<string>>this.alternate);
      }
      return calls;
    }
  }
