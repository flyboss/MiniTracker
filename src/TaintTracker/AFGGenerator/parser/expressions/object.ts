import { negateTruthiness } from './negator';
import { stringify } from './stringifier';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from '../statements/expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
} from '../../estreeFactory';
import { ExpressionParser } from './interface';

export { parseObjectExpression };

const parseObjectExpression: ExpressionParser = function (
  objectExpression: ESTree.ObjectExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
) {
  // parse every property
  for (let property of objectExpression.properties) {
    if (idLookUpTable.isPageParam && stringify(property) === 'data') {
      idLookUpTable.isPageData = true;
    }
    currentNode = parseExpression(
      property.value,
      currentNode,
      context,
      idLookUpTable
    );
    let valueExprLabel = stringify(property.value);
    if (idLookUpTable.lookup(valueExprLabel) != '') {
      property.value = createIdentifier(idLookUpTable.lookup(valueExprLabel));
    }
  }
  let currentExprLabel = stringify(objectExpression);
  if (idLookUpTable.isPageData) {
    idLookUpTable.storeSpecific(currentExprLabel, '__PageData__');
    idLookUpTable.isPageData = false;
  } else if (idLookUpTable.isPageParam) {
    idLookUpTable.storeSpecific(currentExprLabel, '__PageParameter__');
    idLookUpTable.isPageParam = false;
  } else {
    idLookUpTable.store(currentExprLabel);
  }
  let tempVarAssignmentExpr = createAssignmentExpression({
    left: createIdentifier(idLookUpTable.lookup(currentExprLabel)),
    right: objectExpression,
  });
  return context
    .createNode()
    .appendTo(
      currentNode,
      stringify(tempVarAssignmentExpr),
      tempVarAssignmentExpr,
      objectExpression.loc
    );
};
