import * as jsdom from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

import * as parser from '@babel/parser';
import traverse, { NodePath, TraverseOptions } from '@babel/traverse';
import generate from '@babel/generator';
import * as types from '@babel/types';
import { HtmlIfStmt } from './fileInfo/ifStmt';

function parseHtmlIfStmt(view: Element): HtmlIfStmt {
  /**
   * Parses an html element containing wx:if or wx:elif
   * returns an htmlIfStmt Object.
   *
   * @param {Element} view - the HTML Element to be parsed
   *
   * @returns {HtmlIfStmt} - an htmlIfStmt
   */
  let condition = view.getAttribute('wx:if');
  condition = condition ?? view.getAttribute('wx:elif');

  let currentStmt = new HtmlIfStmt(
    condition.replace('{{', '').replace('}}', '')
  );

  for (let j = 0; j < view.children.length; ++j) {
    let handler = view.children[j].getAttribute('bindtap');
    if (handler != null) {
      currentStmt.consequence.push(handler);
    }
  }
  let next = view.nextSibling;
  while (next?.nodeType === 3) {
    // 3 refers to TEXT_NODE, thank you DOM.
    next = next.nextSibling;
  }
  let nextView = <Element>next;
  if (nextView == null) {
    return currentStmt;
  }
  if (nextView.hasAttribute('wx:else')) {
    currentStmt.alternate = new Array<string>();
    for (let j = 0; j < nextView.children.length; ++j) {
      let handler = nextView.children[j].getAttribute('bindtap');
      if (handler != null) {
        currentStmt.alternate.push(handler);
      }
    }
  } else if (nextView.hasAttribute('wx:elif')) {
    currentStmt.hasElif = true;
    currentStmt.alternate = parseHtmlIfStmt(nextView);
  }
  return currentStmt;
}

export function getIfStmts(body: HTMLElement): Array<HtmlIfStmt> {
  /**
   * Extracts all wx:if statements in a .html file
   *
   * @param {HTMLElement} body - the html file, as an HTMLElement
   *
   * @returns {Array<HtmlIfStmt>} - a list of all if statements
   */
  let results = new Array<HtmlIfStmt>();

  let elementList = body.getElementsByTagName('*');

  for (let i = 0; i < elementList.length; ++i) {
    let element = elementList[i];
    if (element === null) continue;
    if (element.hasAttribute('wx:if')) {
      results.push(parseHtmlIfStmt(element));
    }
  }
  return results;
}
