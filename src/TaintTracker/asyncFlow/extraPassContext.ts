import { Identifier } from "../AFGGenerator/estree";
import { FlowNode, NodeType } from "../AFGGenerator/flow";
import IdRecorder from "../AFGGenerator/util/idGenerator";
import { createIdentifier } from "../AFGGenerator/estreeFactory";

export interface ExtraPassContext {
  createTempVarIdentifier(): Identifier;
  createNode(type?: NodeType): FlowNode;
}

export function createExtraPassContext(): ExtraPassContext {
  let nodeIdGenerator = IdRecorder.create();
  let tempVarIdGenerator = IdRecorder.create();

  let context: ExtraPassContext = {
    createTempVarIdentifier() {
      let id = tempVarIdGenerator.generateId();
      return createIdentifier(`secondPassTemp${id}`);
    },

    createNode(type = NodeType.Normal) {
      // TODO: Node id for new nodes created in the second pass are all negative;
      //       should this be optimized?
      let id = -nodeIdGenerator.generateId();
      return new FlowNode(id, type);
    },
  };

  return context;
}
