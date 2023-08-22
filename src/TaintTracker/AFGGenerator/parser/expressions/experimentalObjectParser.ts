import { negateTruthiness } from './negator';
import { stringify } from './stringifier';

import * as ESTree from '../../estree';
import { Completion, FlowNode, ParsingContext } from '../../flow';
import { parseExpression } from '../statements/expression';
import { IdRecorder } from '../../util/idGenerator';
import {
  createAssignmentExpression,
  createIdentifier,
  createMemberExpression,
} from '../../estreeFactory';
import { ExpressionParser } from './interface';

export { parseObjectExpressionExperimental };

const parseObjectExpressionExperimental: ExpressionParser = function (
  objectExpression: ESTree.ObjectExpression,
  currentNode: FlowNode,
  context: ParsingContext,
  idLookUpTable: IdRecorder
): FlowNode {
  let currentExprLabel = stringify(objectExpression);
  // idLookUpTable.store(currentExprLabel);
  if (idLookUpTable.isPageData) {
    idLookUpTable.storeSpecific(currentExprLabel, '__PageData__');
  } else if (idLookUpTable.isPageParam) {
    idLookUpTable.storeSpecific(currentExprLabel, '__PageParameter__');
  } else if (idLookUpTable.isApp) {
    idLookUpTable.storeSpecific(currentExprLabel, '__AppParameter__');
    idLookUpTable.isApp = false;
  } else if (idLookUpTable.isComponentParam) {
    idLookUpTable.storeSpecific(currentExprLabel, '__ComponentParameter__');
    idLookUpTable.isComponentParam = false;
  } else {
    idLookUpTable.store(currentExprLabel);
  }

  let i = 0;
  for (let property of objectExpression.properties) {
    if (idLookUpTable.isPageParam && stringify(property.key) === 'data') {
      idLookUpTable.isPageData = true;
    }
    currentNode = parseExpression(
      property.value,
      currentNode,
      context,
      idLookUpTable
    );
    if (idLookUpTable.lookup(stringify(property.value)) !== '') {
      objectExpression.properties[i].value = createIdentifier(
        idLookUpTable.lookup(stringify(property.value))
      );
    }
    let currentMember = createMemberExpression(
      createIdentifier(idLookUpTable.lookup(currentExprLabel)),
      property.key
    );
    let currentProperty = createAssignmentExpression({
      left: currentMember,
      right: property.value,
    });
    currentNode = context
      .createNode()
      .appendTo(currentNode, stringify(currentProperty), currentProperty,objectExpression.loc);

    ++i;
  }
  if (idLookUpTable.isPageData) idLookUpTable.isPageData = false;
  if (idLookUpTable.isPageParam) idLookUpTable.isPageParam = false;
  idLookUpTable.add(currentExprLabel, stringify(objectExpression));

  return currentNode;
};
