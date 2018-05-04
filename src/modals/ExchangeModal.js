import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import lang from '../languages';
import Card from '../components/Card';
import Input from '../components/Input';
import LineBreak from '../components/LineBreak';
import DropdownAsset from '../components/DropdownAsset';
import Button from '../components/Button';
import Form from '../components/Form';
import MetamaskLogo from '../components/MetamaskLogo';
import LedgerLogo from '../components/LedgerLogo';
import TrezorLogo from '../components/TrezorLogo';
import convertSymbol from '../assets/convert-symbol.svg';
import arrowUp from '../assets/arrow-up.svg';
import { modalClose } from '../reducers/_modal';
import {
  exchangeClearFields,
  exchangeModalInit,
  exchangeUpdateNativeAmount,
  exchangeUpdateAssetAmount,
  exchangeUpdateDepositSelected,
  exchangeUpdateWithdrawalSelected,
  exchangeToggleConfirmationView
} from '../reducers/_exchange';
import { notificationShow } from '../reducers/_notification';
import { isValidAddress } from '../helpers/validators';
import { convertAmountFromBigNumber } from '../helpers/bignumber';
import { capitalize } from '../helpers/utilities';
import { fonts, colors } from '../styles';

const StyledSuccessMessage = styled.div`
  width: 100%;
  padding: 22px;
  & a {
    text-decoration: underline;
    font-weight: ${fonts.weight.semibold};
  }
  & > *:nth-child(n + 2) {
    margin-top: 24px;
  }
`;

const StyledIcon = styled.div`
  width: 14px;
  height: 14px;
  mask: ${({ icon }) => (icon ? `url(${icon}) center no-repeat` : 'none')};
  mask-size: 90%;
  background-color: ${({ color }) => (color ? `rgb(${colors[color]})` : `rgb(${colors.dark})`)};
`;

const StyledFlex = styled.div`
  display: flex;
  position: relative;
  transform: none;
`;

const StyledDropdownWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledDropdownLabel = styled.p`
  color: rgb(${colors.grey});
  font-size: 13px;
  font-weight: ${fonts.weight.semibold};
  margin-bottom: 8px;
`;

const StyledHelperText = styled.div`
  width: 100%;
  display: flex;
`;

const StyledBottomModal = styled(StyledFlex)`
  & p {
    font-size: ${fonts.size.h6};
  }
  & > * {
    width: 100%;
  }
`;

const StyledParagraph = styled.p`
  margin: 10px 0;
  color: rgb(${colors.grey});
  font-weight: ${fonts.weight.medium};
`;

const StyledHash = styled.p`
  font-size: ${fonts.size.small};
  font-weight: 600;
  text-align: center;
  letter-spacing: -0.4px;
  background: rgb(${colors.white});
  border-radius: 8px;
  margin: 0 auto;
  padding: 12px 18px;
`;

const StyledAmountCurrency = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: ${fonts.size.medium};
  color: rgba(${colors.darkGrey}, 0.7);
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`;

const StyledConversionSymbol = styled.div`
  width: 46px;
  position: relative;
  & img {
    width: 20px;
    position: absolute;
    bottom: 12px;
    left: calc(50% - 10px);
  }
`;

const StyledSubTitle = styled.div`
  display: flex;
  align-items: center;
  color: rgb(${colors.grey});
  font-size: ${fonts.size.h6};
  font-weight: ${fonts.weight.semibold};
  width: 100%;
  & ${StyledIcon} {
    margin-right: 5px;
  }
`;

const StyledMaxBalance = styled.p`
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0;
  line-height: 1.8em;
  font-size: ${fonts.size.small};
  font-weight: ${fonts.weight.medium};
  color: rgba(${colors.blue}, 0.8);
  @media (hover: hover) {
    &:hover {
      opacity: 0.6;
    }
  }
`;

const StyledApproveTransaction = styled.div`
  padding: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  & > div {
    margin-top: 15px;
  }
  & > p {
    margin-top: 32px;
  }
`;

const StyledActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ single }) => (single ? `center` : `space-between`)};
  & button {
    margin: 0 5px;
  }
`;

class ExchangeModal extends Component {
  componentDidMount() {
    const depositSelected = this.props.modalProps.assets.filter(asset => asset.symbol === 'ETH')[0];
    this.props.exchangeModalInit(this.props.modalProps.address, depositSelected);
  }
  onChangeDepositSelected = value => {
    let depositSelected = this.props.modalProps.assets.filter(asset => asset.symbol === 'ETH')[0];
    if (value !== 'ETH') {
      depositSelected = this.props.modalProps.assets.filter(asset => asset.symbol === value)[0];
    }
    if (
      this.props.prices[this.props.nativeCurrency] &&
      this.props.prices[this.props.nativeCurrency][depositSelected.symbol]
    ) {
      this.props.exchangeUpdateAssetAmount(this.props.assetAmount, depositSelected);
    }
    this.props.exchangeUpdateDepositSelected(depositSelected);
  };
  onChangeWithdrawalSelected = value => {
    let withdrawalSelected = this.props.availableAssets.filter(asset => asset.symbol === 'ETH')[0];
    if (value !== 'ETH') {
      withdrawalSelected = this.props.availableAssets.filter(asset => asset.symbol === value)[0];
    }
    if (
      this.props.prices[this.props.nativeCurrency] &&
      this.props.prices[this.props.nativeCurrency][withdrawalSelected.symbol]
    ) {
      this.props.exchangeUpdateAssetAmount(this.props.assetAmount, withdrawalSelected);
    }
    this.props.exchangeUpdateWithdrawalSelected(withdrawalSelected);
  };
  onAddressInputFocus = () => this.setState({ isValidAddress: true });
  onAddressInputBlur = () =>
    this.setState({ isValidAddress: isValidAddress(this.props.recipient) });
  onGoBack = () => this.props.exchangeTogfgleConfirmationView(false);
  onExchangeAnother = () => {
    this.props.exchangeToggleConfirmationView(false);
    this.props.exchangeClearFields();
    const depositSelected = this.props.modalProps.assets.filter(asset => asset.symbol === 'ETH')[0];
    this.props.exchangeModalInit(this.props.modalProps.address, depositSelected);
  };
  onSubmit = e => {
    e.preventDefault();
    const request = {
      address: this.props.modalProps.address,
      recipient: this.props.recipient,
      amount: this.props.assetAmount,
      depositSelectedAsset: this.props.depositSelected,
      gasPrice: this.props.gasPrice,
      gasLimit: this.props.gasLimit
    };
    if (!this.props.gasPrice.txFee) {
      this.props.notificationShow(lang.t('notification.error.generic_error'), true);
      return;
    }
    if (!this.props.confirm) {
      if (!isValidAddress(this.props.recipient)) {
        this.props.notificationShow(lang.t('notification.error.invalid_address'), true);
        return;
      } else if (this.props.depositSelected.symbol === 'ETH') {
        const ethereum = this.props.modalProps.assets.filter(asset => asset.symbol === 'ETH')[0];
        const balanceAmount = ethereum.balance.amount;
        const balance = convertAmountFromBigNumber(balanceAmount);
        const requestedAmount = BigNumber(`${this.props.assetAmount}`).toString();
        const txFeeAmount = this.props.gasPrice.txFee.value.amount;
        const txFee = convertAmountFromBigNumber(txFeeAmount);
        const includingFees = BigNumber(requestedAmount)
          .plus(BigNumber(txFee))
          .toString();
        if (BigNumber(requestedAmount).comparedTo(BigNumber(balance)) === 1) {
          this.props.notificationShow(lang.t('notification.error.insufficient_balance'), true);
          return;
        } else if (BigNumber(includingFees).comparedTo(BigNumber(balance)) === 1) {
          this.props.notificationShow(lang.t('notification.error.insufficient_for_fees'), true);
          return;
        }
        switch (this.props.modalProps.accountType) {
          case 'METAMASK':
            this.props.exchangeEtherMetamask(request);
            break;
          case 'LEDGER':
            this.props.exchangeEtherLedger(request);
            break;
          default:
            this.props.exchangeEtherMetamask(request);
            break;
        }
      } else {
        const ethereum = this.props.modalProps.assets.filter(asset => asset.symbol === 'ETH')[0];
        const etherBalanceAmount = ethereum.balance.amount;
        const etherBalance = convertAmountFromBigNumber(etherBalanceAmount);
        const tokenBalanceAmount = this.props.depositSelected.balance.amount;
        const tokenBalance = convertAmountFromBigNumber(tokenBalanceAmount);
        const requestedAmount = BigNumber(`${this.props.assetAmount}`).toString();
        const includingFees = convertAmountFromBigNumber(this.props.gasPrice.txFee.value.amount);
        if (BigNumber(requestedAmount).comparedTo(BigNumber(tokenBalance)) === 1) {
          this.props.notificationShow(lang.t('notification.error.insufficient_balance'), true);
          return;
        } else if (BigNumber(includingFees).comparedTo(BigNumber(etherBalance)) === 1) {
          this.props.notificationShow(lang.t('notification.error.insufficient_for_fees'), true);
          return;
        }
        switch (this.props.modalProps.accountType) {
          case 'METAMASK':
            this.props.exchangeTokenMetamask(request);
            break;
          case 'LEDGER':
            this.props.exchangeTokenLedger(request);
            break;
          default:
            this.props.exchangeTokenMetamask(request);
            break;
        }
      }
    }
    this.props.exchangeToggleConfirmationView(true);
  };
  onClose = () => {
    this.props.exchangeClearFields();
    this.props.modalClose();
  };
  render = () => {
    const availableSymbols = this.props.availableAssets.map(
      availableAsset => availableAsset.symbol
    );
    const filteredAvailableAssets = this.props.modalProps.assets.filter(
      asset => availableSymbols.indexOf(asset.symbol) !== -1
    );
    return (
      <Card allowOverflow background="lightGrey" fetching={this.props.fetching}>
        {!this.props.txHash ? (
          !this.props.confirm ? (
            <Form onSubmit={this.onSubmit}>
              <StyledSubTitle>
                <StyledIcon color="grey" icon={arrowUp} />
                {lang.t('modal.exchange_title', {
                  walletName: capitalize(this.props.modalProps.name)
                })}
              </StyledSubTitle>

              <StyledFlex>
                <StyledDropdownWrapper>
                  <StyledDropdownLabel>Exchange my</StyledDropdownLabel>
                  <DropdownAsset
                    noBalance
                    selected={this.props.depositSelected.symbol}
                    assets={filteredAvailableAssets}
                    onChange={this.onChangeDepositSelected}
                  />
                  <StyledHelperText>
                    <div>
                      <strong />
                      <p />
                    </div>
                    <div>
                      <strong />
                      <p />
                    </div>
                  </StyledHelperText>
                </StyledDropdownWrapper>
                <StyledFlex>
                  <StyledConversionSymbol>
                    <img src={convertSymbol} alt="conversion" />
                  </StyledConversionSymbol>
                </StyledFlex>
                <StyledDropdownWrapper>
                  <StyledDropdownLabel>with</StyledDropdownLabel>
                  <DropdownAsset
                    noBalance
                    selected={this.props.withdrawalSelected.symbol}
                    assets={this.props.availableAssets}
                    onChange={this.onChangeWithdrawalSelected}
                  />
                  <StyledHelperText>
                    <div>
                      <strong />
                      <p />
                    </div>
                    <div>
                      <strong />
                      <p />
                    </div>
                  </StyledHelperText>
                </StyledDropdownWrapper>
              </StyledFlex>

              <StyledFlex>
                <StyledFlex>
                  <Input
                    monospace
                    label={lang.t('input.pay')}
                    placeholder="0.0"
                    type="text"
                    value={this.props.assetAmount}
                    onChange={({ target }) =>
                      this.props.exchangeUpdateAssetAmount(target.value, this.props.depositSelected)
                    }
                  />
                  <StyledMaxBalance onClick={this.onExchangeEntireBalance}>
                    {lang.t('modal.maximum_balance')}
                  </StyledMaxBalance>
                  <StyledAmountCurrency>{this.props.depositSelected.symbol}</StyledAmountCurrency>
                </StyledFlex>
                <StyledFlex>
                  <StyledConversionSymbol>
                    <img src={convertSymbol} alt="conversion" />
                  </StyledConversionSymbol>
                </StyledFlex>
                <StyledFlex>
                  <Input
                    monospace
                    placeholder="0.0"
                    label={lang.t('input.get')}
                    type="text"
                    value={this.props.nativeAmount}
                    disabled={
                      !this.props.prices[this.props.nativeCurrency] ||
                      !this.props.prices[this.props.nativeCurrency][
                        this.props.depositSelected.symbol
                      ]
                    }
                    onChange={({ target }) =>
                      this.props.exchangeUpdateNativeAmount(
                        target.value,
                        this.props.depositSelected
                      )
                    }
                  />
                  <StyledAmountCurrency
                    disabled={!this.props.prices[this.props.depositSelected.symbol]}
                  >
                    {this.props.prices && this.props.prices.depositSelected
                      ? this.props.prices.depositSelected.currency
                      : ''}
                  </StyledAmountCurrency>
                </StyledFlex>
              </StyledFlex>

              <LineBreak />

              <StyledBottomModal>
                <StyledActions>
                  <Button onClick={this.onClose}>{lang.t('button.cancel')}</Button>
                  <Button
                    left
                    color="blue"
                    icon={arrowUp}
                    disabled={
                      this.props.recipient.length !== 42 ||
                      (this.props.depositSelected.symbol !== 'ETH' &&
                        !Number(this.props.assetAmount))
                    }
                    type="submit"
                  >
                    {lang.t('button.exchange')}
                  </Button>
                </StyledActions>
              </StyledBottomModal>
            </Form>
          ) : (
            <StyledApproveTransaction>
              {(() => {
                switch (this.props.modalProps.accountType) {
                  case 'METAMASK':
                    return <MetamaskLogo />;
                  case 'LEDGER':
                    return <LedgerLogo />;
                  case 'TREZOR':
                    return <TrezorLogo />;
                  default:
                    return <div />;
                }
              })()}
              <StyledParagraph>
                {lang.t('modal.approve_tx', {
                  walletType: capitalize(this.props.modalProps.accountType)
                })}
              </StyledParagraph>
              <StyledActions single>
                <Button onClick={this.onClose}>{lang.t('button.close')}</Button>
              </StyledActions>
            </StyledApproveTransaction>
          )
        ) : (
          <StyledSuccessMessage>
            <StyledSubTitle>
              <StyledIcon color="grey" icon={arrowUp} />
              {`Success`}
            </StyledSubTitle>
            <div>
              <StyledParagraph>
                <strong>{`${lang.t('modal.tx_hash')}:`}</strong>
              </StyledParagraph>
              <StyledHash>{` ${this.props.txHash}`}</StyledHash>
            </div>
            <StyledParagraph>
              <a
                href={`https://${
                  this.props.network !== 'mainnet' ? `${this.props.network}.` : ''
                }etherscan.io/tx/${this.props.txHash}`}
                target="_blank"
              >
                {lang.t('modal.tx_verify')}
              </a>
            </StyledParagraph>
            <StyledActions>
              <Button onClick={this.onExchangeAnother}>{lang.t('button.exchange_another')}</Button>
              <Button color="red" onClick={this.onClose}>
                {lang.t('button.close')}
              </Button>
            </StyledActions>
          </StyledSuccessMessage>
        )}
      </Card>
    );
  };
}

ExchangeModal.propTypes = {
  exchangeClearFields: PropTypes.func.isRequired,
  exchangeModalInit: PropTypes.func.isRequired,
  exchangeUpdateNativeAmount: PropTypes.func.isRequired,
  exchangeUpdateAssetAmount: PropTypes.func.isRequired,
  exchangeUpdateDepositSelected: PropTypes.func.isRequired,
  exchangeUpdateWithdrawalSelected: PropTypes.func.isRequired,
  exchangeToggleConfirmationView: PropTypes.func.isRequired,
  notificationShow: PropTypes.func.isRequired,
  modalClose: PropTypes.func.isRequired,
  modalProps: PropTypes.object.isRequired,
  fetching: PropTypes.bool.isRequired,
  address: PropTypes.string.isRequired,
  recipient: PropTypes.string.isRequired,
  nativeAmount: PropTypes.string.isRequired,
  assetAmount: PropTypes.string.isRequired,
  availableAssets: PropTypes.array.isRequired,
  txHash: PropTypes.string.isRequired,
  confirm: PropTypes.bool.isRequired,
  depositSelected: PropTypes.object.isRequired,
  withdrawalSelected: PropTypes.object.isRequired,
  network: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  prices: PropTypes.object.isRequired
};

const reduxProps = ({ modal, exchange, account }) => ({
  modalProps: modal.modalProps,
  fetching: exchange.fetching,
  address: exchange.address,
  recipient: exchange.recipient,
  nativeAmount: exchange.nativeAmount,
  assetAmount: exchange.assetAmount,
  availableAssets: exchange.availableAssets,
  txHash: exchange.txHash,
  confirm: exchange.confirm,
  depositSelected: exchange.depositSelected,
  withdrawalSelected: exchange.withdrawalSelected,
  network: account.network,
  nativeCurrency: account.nativeCurrency,
  prices: account.prices
});

export default connect(reduxProps, {
  modalClose,
  exchangeClearFields,
  exchangeModalInit,
  exchangeUpdateNativeAmount,
  exchangeUpdateAssetAmount,
  exchangeUpdateDepositSelected,
  exchangeUpdateWithdrawalSelected,
  exchangeToggleConfirmationView,
  notificationShow
})(ExchangeModal);
