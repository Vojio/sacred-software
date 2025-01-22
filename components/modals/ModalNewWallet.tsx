import styles from './ModalNewWallet.module.scss';
import * as React from 'react';
import Input from '@components/Input';
import { useModals } from '@components/page/ModalContext';
import Text from '@components/Text';
import Divider from '@components/Divider';
import ActionBar from '@components/ActionBar';
import ActionButton from '@components/ActionButton';

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
      <br />
      <ActionBar
        items={[
          {
            body: 'Add Wallet',
            onClick: handleAddWallet,
          },
          {
            body: buttonText,
            onClick: () => close(),
          },
        ]}
      />
    </div>
  );
};

export default ModalNewWallet;
