import * as types from '@babel/types';
import { Config } from '../../utils/config';

export function getInputCallExpression() {
  return types.callExpression(
    types.memberExpression(
      types.identifier(Config['api_prefix'].replace('.','')),
      types.identifier('input')
    ),
    []
  );
}
