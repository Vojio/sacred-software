import styles from './ModalNewWallet.module.scss';
import * as React from 'react';
import Button from '@components/Button';
import Input from '@components/Input';
import Text from '@components/Text';
import { useModals } from '@components/page/ModalContext';
import { useHotkeys } from '@modules/hotkeys';

interface ModalNewWalletProps {
  buttonText?: string;
  onAddWallet?: (name: string, address: string) => void;
}

const ModalNewWallet: React.FC<ModalNewWalletProps> = ({ buttonText = 'Close', onAddWallet }) => {
  const { close } = useModals();
  const [newWalletName, setNewWalletName] = React.useState('');
  const [newWalletAddress, setNewWalletAddress] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleAddWallet = () => {
    if (!newWalletName) {
      setError('Wallet name cannot be empty.');
      return;
    }
    if (!newWalletAddress) {
      setError('Wallet address cannot be empty.');
      return;
    }
    if (onAddWallet) {
      onAddWallet(newWalletName, newWalletAddress);
    }
    close();
  };

  useHotkeys([
    {
      keys: 'enter',
      callback: () => {
        handleAddWallet();
      },
    },
  ]);

  return (
    <div className={styles.root}>
      <Text>Add a new wallet</Text>
      {error && <Text style={{ color: 'var(--theme-error)' }}>{error}</Text>}
      <Input
        name="wallet-name"
        value={newWalletName}
        onChange={(e) => {
          setNewWalletName(e.target.value);
          setError(null);
        }}
        placeholder="Wallet name"
        style={{ marginBottom: '1ch' }}
      />
      <Input
        name="wallet-address"
        value={newWalletAddress}
        onChange={(e) => {
          setNewWalletAddress(e.target.value);
          setError(null);
        }}
        placeholder="BTC address"
        style={{ marginBottom: '1ch' }}
      />
      <Button onClick={handleAddWallet} theme="SECONDARY">
        Add Wallet
      </Button>
      <br />
      <Button onClick={() => close()} theme="SECONDARY">
        {buttonText}
      </Button>
    </div>
  );
};

export default ModalNewWallet;
