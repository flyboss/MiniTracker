import * as ESTree from '../estree';
import { stringify } from '../parser/expressions/stringifier';
import { createIdentifier } from '../estreeFactory';
import { IdRecorder } from './idGenerator';
import {Expression} from "../estree";

export function getIdentifier(
  expression: ESTree.Expression,
  idLookUpTable: IdRecorder
):Expression {
  const label = stringify(expression);
  const tempVar = idLookUpTable.lookup(label);
  if (tempVar !== '') {
    return createIdentifier(tempVar);
  } else {
    return expression;
  }
}
