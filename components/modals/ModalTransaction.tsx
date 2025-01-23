'use client';

import styles from '@components/modals/ModalTransaction.module.scss';

import * as React from 'react';
import * as Utilities from '@common/utilities';

import { useModals } from '@components/page/ModalContext';

import Button from '@components/Button';
import Card from '@components/Card';
import Text from '@components/Text';
import Table from '@components/Table';
import TableRow from '@components/TableRow';
import TableColumn from '@components/TableColumn';
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
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
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
  const date = new Date(transaction.confirmed);

  return (
    <div className={styles.root}>
      <Card title="Transaction Details">
        <Table>
          <TableRow>
            <TableColumn>
              <Text>Type</Text>
            </TableColumn>
            <TableColumn>
              <Text
                style={{
                  color: transaction.tx_input_n === -1 ? 'var(--theme-success)' : 'var(--theme-error)',
                }}
              >
                {transaction.tx_input_n === -1 ? 'Incoming' : 'Outgoing'}
              </Text>
            </TableColumn>
          </TableRow>

          <TableRow>
            <TableColumn>
              <Text>Date</Text>
            </TableColumn>
            <TableColumn>
              <Text>
                {date.toLocaleString('de-DE', {
                  dateStyle: 'medium',
                })}
              </Text>
            </TableColumn>
          </TableRow>
          <TableRow>
            <TableColumn>
              <Text>Time</Text>
            </TableColumn>
            <TableColumn>
              <Text>
                {date.toLocaleString('de-DE', {
                  timeStyle: 'short',
                })}
              </Text>
            </TableColumn>
          </TableRow>

          <TableRow>
            <TableColumn>
              <Text>Sats</Text>
            </TableColumn>
            <TableColumn>
              <Text>{formatValue(formatNumber(transaction.value, 0), hideValues)}</Text>
            </TableColumn>
          </TableRow>

          <TableRow>
            <TableColumn>
              <Text>BTC</Text>
            </TableColumn>
            <TableColumn>
              <Text>{hideValues ? formatValue(btcAmount.toFixed(8), hideValues) : `₿${formatValue(btcAmount.toFixed(8), hideValues)}`}</Text>
            </TableColumn>
          </TableRow>

          <TableRow>
            <TableColumn>
              <Text>Value</Text>
            </TableColumn>
            <TableColumn>
              <Text>{hideValues ? '****' : currency === 'USD' ? `$${formatCurrency(value)}` : `€${formatCurrency(value)}`}</Text>
            </TableColumn>
          </TableRow>
        </Table>

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
