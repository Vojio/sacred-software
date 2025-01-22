import styles from './ModalNewWallet.module.scss';
import * as React from 'react';
import Button from '@components/Button';
import Input from '@components/Input';
import { useModals } from '@components/page/ModalContext';

interface ModalNewWalletProps {
  buttonText?: string;
  onAddWallet?: (name: string, address: string) => void;
}

const ModalNewWallet: React.FC<ModalNewWalletProps> = ({ buttonText = 'Close', onAddWallet }) => {
  const { close } = useModals();
  const [newWalletName, setNewWalletName] = React.useState('');
  const [newWalletAddress, setNewWalletAddress] = React.useState('');

  const handleAddWallet = () => {
    if (onAddWallet) {
      onAddWallet(newWalletName, newWalletAddress);
    }
    close();
  };

  return (
    <div className={styles.root}>
      <Input name="wallet-name" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="Wallet name" style={{ marginBottom: '1ch' }} />
      <Input name="wallet-address" value={newWalletAddress} onChange={(e) => setNewWalletAddress(e.target.value)} placeholder="BTC address" style={{ marginBottom: '1ch' }} />
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
