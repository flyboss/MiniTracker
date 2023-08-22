import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Expression,
  Identifier,
  Literal,
  MemberExpression,
  NodeType,
  ReturnStatement,
  UnaryExpression,
} from './estree';

export function createAssignmentExpression({
  left,
  right,
}: {
  left: Identifier | Expression;
  right: Expression;
}): AssignmentExpression {
  return {
    type: NodeType.AssignmentExpression,
    operator: '=',
    left,
    right,
  };
}

export function createCallExpression(
  callee: Expression,
  args: Expression[] = []
): CallExpression {
  return {
    type: NodeType.CallExpression,
    callee,
    arguments: args,
  };
}

export function createIdentifier(name: string): Identifier {
  return {
    type: NodeType.Identifier,
    name,
  };
}

export function createPageParamIdentifier(): Identifier {
  /**
   * Creates a __PageParameter__ identifier
   *
   * @returns {Identifier} id: __PageParameter__
   */
  return {
    type: NodeType.Identifier,
    name: '__PageParameter__',
  };
}

export function createPageDataMemberExpression(): MemberExpression {
  /**
   * Creates a __PageParameter__.data member expression.
   *
   * @returns {MemberExpression} __PageParameter__.data
   */
  return {
    type: NodeType.MemberExpression,
    computed: false,
    object: createIdentifier('__PageParameter__'),
    property: createIdentifier('data'),
  };
}

export function createMemberExpression(
  obj: Expression,
  prop: Expression
): MemberExpression {
  return {
    type: NodeType.MemberExpression,
    computed: false,
    object: obj,
    property: prop,
  };
}

export function createIdentityComparisonExpression({
  left,
  right,
}: {
  left: Expression;
  right: Expression;
}): BinaryExpression {
  return {
    type: NodeType.BinaryExpression,
    operator: '===',
    left,
    right,
  };
}

export function createLiteral(value: boolean | number): Literal {
  return {
    type: NodeType.Literal,
    raw: String(value),
    value: value,
  };
}

export function createUnaryNegationExpression(
  innerExpression: Expression
): UnaryExpression {
  return {
    type: NodeType.UnaryExpression,
    operator: '!',
    prefix: true,
    argument: innerExpression,
  };
}

export function createReturnStatement(arg: Expression): ReturnStatement {
  return {
    type: NodeType.ReturnStatement,
    argument: arg,
  };
}
