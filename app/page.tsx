'use client';

import '@root/global.scss';

import * as React from 'react';

import DebugGrid from '@components/DebugGrid';
import DefaultActionBar from '@components/page/DefaultActionBar';
import DefaultLayout from '@components/page/DefaultLayout';
import Grid from '@components/Grid';
import CardDouble from '@components/CardDouble';
import ModalStack from '@components/ModalStack';
import Package from '@root/package.json';
import Row from '@components/Row';
import BTCWallet from '@components/examples/BTCWallet';

export default function Page() {
  return (
    <DefaultLayout previewPixelSRC="https://intdev-global.s3.us-west-2.amazonaws.com/template-app-icon.png">
      <Grid>
        <br />
        <Row>{Package.name.toUpperCase()}</Row>
        <Row>{Package.description}</Row>
        <br />
        <CardDouble title="Wallet Monitor">
          <BTCWallet />
        </CardDouble>
      </Grid>

      <DebugGrid />
      <DefaultActionBar />
      <ModalStack />
    </DefaultLayout>
  );
}
