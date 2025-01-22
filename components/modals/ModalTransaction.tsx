'use client';

import styles from '@components/modals/ModalTransaction.module.scss';

import * as React from 'react';
import * as Utilities from '@common/utilities';

import { useModals } from '@components/page/ModalContext';

import Button from '@components/Button';
import Card from '@components/Card';
import Text from '@components/Text';
import RowSpaceBetween from '@components/RowSpaceBetween';
import Divider from '@components/Divider';

interface ModalTransactionProps {
  buttonText?: string;
  transaction: {
    confirmed: string;
    tx_input_n: number;
    value: number;
    hash?: string;
  };
  btcPrice: number;
  btcPriceEUR: number;
  currency: 'USD' | 'EUR';
  hideValues: boolean;
}

const formatNumber = (value: number, minimumFractionDigits = 2, maximumFractionDigits = 8): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatValue = (value: number | string, hideValues: boolean, isCurrency = false) => {
  if (hideValues) {
    return isCurrency ? '****' : '********';
  }
  return typeof value === 'number' ? formatNumber(value) : value;
};

function ModalTransaction({ buttonText, transaction, btcPrice, btcPriceEUR, currency, hideValues }: ModalTransactionProps) {
  const { close } = useModals();

  const value = currency === 'EUR' ? (transaction.value / 100000000) * btcPriceEUR : (transaction.value / 100000000) * btcPrice;
  const btcAmount = transaction.value / 100000000;

  return (
    <div className={styles.root}>
      <Card title="Transaction Details">
        <RowSpaceBetween>
          <Text>Type</Text>
          <Text
            style={{
              color: transaction.tx_input_n === -1 ? 'var(--theme-success)' : 'var(--theme-error)',
            }}
          >
            {transaction.tx_input_n === -1 ? 'Incoming' : 'Outgoing'}
          </Text>
        </RowSpaceBetween>

        <RowSpaceBetween>
          <Text>Date</Text>
          <Text>
            {new Date(transaction.confirmed).toLocaleString('de-DE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Text>
        </RowSpaceBetween>

        <RowSpaceBetween>
          <Text>Amount (sats)</Text>
          <Text>{formatValue(formatNumber(transaction.value, 0), hideValues)}</Text>
        </RowSpaceBetween>

        <RowSpaceBetween>
          <Text>Amount (BTC)</Text>
          <Text>{formatValue(btcAmount.toFixed(8), hideValues)}</Text>
        </RowSpaceBetween>

        <RowSpaceBetween>
          <Text>Value ({currency})</Text>
          <Text>{hideValues ? '****' : currency === 'USD' ? `$${formatCurrency(value)}` : `€${formatCurrency(value)}`}</Text>
        </RowSpaceBetween>

        {transaction.hash && (
          <>
            <Divider />
            <Text style={{ opacity: 0.7 }}>Transaction Hash</Text>
            <Text style={{ wordBreak: 'break-all', fontSize: '0.9em' }}>{transaction.hash}</Text>
          </>
        )}

        <br />
        <Button onClick={() => close()}>{Utilities.isEmpty(buttonText) ? 'Close' : buttonText}</Button>
      </Card>
    </div>
  );
}

export default ModalTransaction;
