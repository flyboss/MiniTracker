import * as ESTree from "../../estree";
import {FlowNode, ParsingContext} from "../../flow";
import {IdRecorder} from "../../util/idGenerator";

export interface ExpressionParser {
    (expression: ESTree.Expression,
     currentNode: FlowNode,
     context: ParsingContext,
     idLookUpTable: IdRecorder):FlowNode
}
