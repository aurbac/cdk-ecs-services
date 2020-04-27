import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
//import * as BaseAppStack from '../lib/base-app-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    //const stack = new BaseAppStack.BaseAppStack(app, 'MyTestStack', { appName: 'example', cidr: '10.0.0.0/16' });
    // THEN
    /*expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))*/
});
