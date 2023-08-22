import * as ESTree from '../AFGGenerator/estree';
import { stringify } from '../AFGGenerator/parser/expressions/stringifier';
import { logger } from '../../utils/logHelper';
import { splitStringIntoIdentifiers } from './stringManip';

export function matchProperty(
  exprList: Array<ESTree.Identifier>,
  propertyStack: Array<ESTree.Identifier>
): boolean {
  if (!exprList.length) return false;
  if (!propertyStack.length) return false;
  // exprList.forEach((e) => logger.debug(`ExprList: ${e.name}`));
  // propertyStack.forEach((e) => logger.debug(`PropStack: ${e.name}`));
  let nextMemberProperty = exprList.pop();
  let propertyToMatch = propertyStack.pop();
  if (stringify(nextMemberProperty) === stringify(propertyToMatch)) {
    return true;
  }
  propertyStack.push(propertyToMatch);
  exprList.push(nextMemberProperty);
  return false;
}

export function copyPropertyStack(arr: Array<ESTree.Identifier>) {
  let copy = new Array<ESTree.Identifier>();
  for (let item of arr) {
    copy.push(item);
  }

  return copy;
}
