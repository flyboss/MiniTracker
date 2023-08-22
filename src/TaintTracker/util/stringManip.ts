import {
  createIdentifier,
  createMemberExpression,
} from "../AFGGenerator/estreeFactory";
import * as ESTree from "../AFGGenerator/estree";
import { Taint } from "../interfaces/taint";

export function convertStringToMemberExpr(s: string) {
  /**
   * Converts a string of function name (with multiple fields separated by '.') into a Esprima MemberExpression. If no '.' exists, then an Identifier is returned.
   */
  let fieldSequence = s.split(".");
  if (fieldSequence.length === 1) {
    return createIdentifier(fieldSequence[0]);
  }
  let memberExpression = createMemberExpression(
    createIdentifier(fieldSequence[0]),
    createIdentifier(fieldSequence[1])
  );
  for (let i = 2; i < fieldSequence.length; i++) {
    if (fieldSequence[i] === "") continue;
    memberExpression = createMemberExpression(
      memberExpression,
      createIdentifier(fieldSequence[i])
    );
  }

  return memberExpression;
}

export function splitStringIntoIdentifiers(
  s: string
): Array<ESTree.Identifier> {
  /**
   * Splits a string into multiple Identifiers.
   */
  const identifiers = new Array<ESTree.Identifier>();
  for (const field of s.split(".")) {
    if (field === "") continue;
    identifiers.unshift(createIdentifier(field));
  }
  return identifiers;
}

export function stringifyTaintWithPropertyStack(
  taint: Taint
): string {
  let taintWithPropStack = taint.name;
  for (let property of Array.from(taint.propertyStack).reverse()) {
    taintWithPropStack = taintWithPropStack + '.' + property.name
  }
  return taintWithPropStack;
}

export function checkForwardInclusion(left: string, right: string) {
  /**
   * This function checks if an expression (stringified) includes another expression (stringified).
   * Note that this is different from judging whether a string includes another.
   *
   * Forward mode: a.b.c includes a.b
   */
  let leftIdList = splitStringIntoIdentifiers(left);
  let rightIdList = splitStringIntoIdentifiers(right);
  if (leftIdList.length < rightIdList.length) return false;
  while (rightIdList.length) {
    let leftId = leftIdList.pop();
    let rightId = rightIdList.pop();
    if (leftId.name !== rightId.name) return false;
  }
  return true;
}

export function checkBackwardInclusion(left: string, right: string) {
  /**
   * Backward mode: a.b.c includes b.c
   */
  let leftIdList = splitStringIntoIdentifiers(left);
  let rightIdList = splitStringIntoIdentifiers(right);
  if (leftIdList.length < rightIdList.length) return false;
  while (rightIdList.length) {
    let leftId = leftIdList.shift();
    let rightId = rightIdList.shift();
    if (leftId.name !== rightId.name) return false;
  }
  return true;
}

export function getCalleeString(callExprString: string) {
  return callExprString
    .substring(callExprString.indexOf('=') + 1, callExprString.indexOf('('))
    .trim();
}
