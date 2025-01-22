'use client';

import '@root/global.scss';

import * as React from 'react';

import Accordion from '@components/Accordion';
import Badge from '@components/Badge';
import ButtonGroup from '@components/ButtonGroup';
import Card from '@components/Card';
import Input from '@components/Input';
import DebugGrid from '@components/DebugGrid';
import DefaultActionBar from '@components/page/DefaultActionBar';
import DefaultLayout from '@components/page/DefaultLayout';
import Grid from '@components/Grid';
import CardDouble from '@components/CardDouble';
import MatrixLoader from '@components/MatrixLoader';
import MessagesInterface from '@components/examples/MessagesInterface';
import ModalStack from '@components/ModalStack';
import Package from '@root/package.json';
import Row from '@components/Row';
import RowSpaceBetween from '@components/RowSpaceBetween';
import Text from '@components/Text';
import BTCWallet from '@components/examples/BTCWallet';
import Breadcrumbs from '@components/BreadCrumbs';
import ActionListItem from '@root/components/ActionListItem';

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
