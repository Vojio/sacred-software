import styles from './ModalNewWallet.module.scss';
import * as React from 'react';
import Button from '@components/Button';
import Input from '@components/Input';
import { useModals } from '@components/page/ModalContext';
import Text from '@components/Text';
import Divider from '@components/Divider';

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
      <Text style={{ marginBottom: '1ch', display: 'block', textAlign: 'center' }}>Add a new wallet</Text>
      <Text style={{ marginBottom: '2ch', display: 'block', textAlign: 'center', opacity: 0.7, fontSize: '0.8em' }}>Create a new wallet by entering a name and a bitcoin address.</Text>
      <Divider style={{ marginBottom: '2ch' }} />
      <Input label="Wallet name" name="wallet-name" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="e.g.: Yachting" style={{ marginBottom: '1ch' }} />
      <Input label="BTC address" name="wallet-address" value={newWalletAddress} onChange={(e) => setNewWalletAddress(e.target.value)} placeholder="bc1q.., 3.., 1.., bc1p.." style={{ marginBottom: '2ch' }} />
      <Button onClick={handleAddWallet} theme="SECONDARY" style={{ marginBottom: '1ch', width: '100%' }}>
        Add Wallet
      </Button>
      <Divider style={{ marginBottom: '1ch' }} />
      <Button onClick={() => close()} theme="SECONDARY" style={{ width: '100%' }}>
        {buttonText}
      </Button>
    </div>
  );
};

export default ModalNewWallet;
