import {
  useEffect,
  useState,
  useRef,
  useContext,
} from 'react'

import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'

import {
  useNavigate,
} from 'react-router-dom'

import {
  QuoteStatus,
} from './components/QuoteStatus'
import {
  B3Sping,
} from '@/components'

import {
  getBCCustomerAddresses,
  getB2BCustomerAddresses,
  createQuote,
  createBCQuote,
} from '@/shared/service/b2b'

import {
  B3LStorage,
  B3SStorage,
  storeHash,
  addQuoteDraftProduce,
  snackbar,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  useMobile,
  useSetCountry,
} from '@/hooks'

import ContactInfo from './components/ContactInfo'
import QuoteAddress from './components/QuoteAddress'

import {
  BCAddressItemType,
  AddressItemType,
} from '@/types/address'

import {
  convertBCToB2BAddress,
} from '../address/shared/config'

import QuoteInfo from './components/QuoteInfo'

import QuoteTable from './components/QuoteTable'
import {
  AddToQuote,
} from './components/AddToQuote'
import {
  QuoteSummary,
} from './components/QuoteSummary'
import {
  QuoteNote,
} from './components/QuoteNote'
import {
  QuoteAttachment,
} from './components/QuoteAttachment'

import {
  QuoteListitemProps,
} from './shared/config'

import {
  getProductOptionsFields,
} from '../shoppingListDetails/shared/config'

import {
  getAccountFormFields,
} from './config'

import {
  Container,
} from './style'

type BCAddress = {
  node: BCAddressItemType
}

type B2BAddress = {
  node: AddressItemType
}

export interface Country {
  countryCode: string,
  countryName: string,
  id?: string,
}

interface GetValue {
  [key: string]: string,
}
interface InfoRefProps extends HTMLInputElement {
  getContactInfoValue: () => GetValue,
}

interface InfoProps {
  contactInfo: GetValue,
  shippingAddress: GetValue,
  billingAddress: GetValue,
}

interface QuoteTableRef extends HTMLInputElement {
  refreshList: () => void
}

const QuoteDraft = () => {
  const {
    state: {
      role,
      isB2BUser,
      salesRepCompanyId,
      companyInfo: {
        id: companyB2BId,
      },
      countriesList,
      customer,
      currentChannelId: channelId,
    },
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const [isMobile] = useMobile()

  const [loading, setLoading] = useState<boolean>(false)

  const [isEdit, setEdit] = useState<boolean>(false)

  const [addressList, setAddressList] = useState<B2BAddress[]>([])

  const [total, setTotal] = useState<number>(0)

  const [isRefresh, setIsRefresh] = useState<boolean>(false)

  const [info, setInfo] = useState<InfoProps>({
    contactInfo: {},
    shippingAddress: {},
    billingAddress: {},
  })

  const quoteTableRef = useRef<QuoteTableRef | null>(null)

  useSetCountry()

  const contactInfoRef = useRef<InfoRefProps | null>(null)
  const billingRef = useRef<InfoRefProps | null>(null)
  const shippingRef = useRef<InfoRefProps | null>(null)

  const setCustomInfo = (quoteInfo: any) => {
    const newInfo = {
      ...quoteInfo,
    }
    newInfo.contactInfo = {
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.emailAddress,
      phoneNumber: customer.phoneNumber,
    }
    setInfo(newInfo)
    B3LStorage.set('MyQuoteInfo', newInfo)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const MyQuoteInfo = B3LStorage.get('MyQuoteInfo') || {}
        const quoteInfo = {
          ...info, ...MyQuoteInfo,
        }
        if (isB2BUser) {
          const companyId = companyB2BId || salesRepCompanyId
          const {
            addresses: {
              edges: addressB2BList = [],
            },
          } = await getB2BCustomerAddresses(+companyId)

          const shippingDefautAddress = addressB2BList.find((item: B2BAddress) => (item?.node?.isDefaultShipping === 1))
          const billingDefautAddress = addressB2BList.find((item: B2BAddress) => (item?.node?.isDefaultBilling === 1))
          if (shippingDefautAddress && (!quoteInfo?.shippingAddress || JSON.stringify(quoteInfo.shippingAddress) === '{}')) {
            const addressItem = {
              label: shippingDefautAddress?.node?.label || '',
              firstName: shippingDefautAddress?.node?.firstName || '',
              lastName: shippingDefautAddress?.node?.lastName || '',
              company: shippingDefautAddress?.node?.company || '',
              country: shippingDefautAddress?.node?.countryCode || '',
              address: shippingDefautAddress?.node?.addressLine1 || '',
              apartment: shippingDefautAddress?.node?.addressLine2 || '',
              city: shippingDefautAddress?.node?.city || '',
              state: shippingDefautAddress?.node?.state || '',
              zipCode: shippingDefautAddress?.node?.zipCode || '',
              phoneNumber: shippingDefautAddress?.node?.phoneNumber || '',
            }

            quoteInfo.shippingAddress = addressItem
          }
          if (billingDefautAddress && (!quoteInfo?.billingAddress || JSON.stringify(quoteInfo.billingAddress) === '{}')) {
            const addressItem = {
              label: billingDefautAddress?.node?.label || '',
              firstName: billingDefautAddress?.node?.firstName || '',
              lastName: billingDefautAddress?.node?.lastName || '',
              company: billingDefautAddress?.node?.company || '',
              country: billingDefautAddress?.node?.countryCode || '',
              address: billingDefautAddress?.node?.addressLine1 || '',
              apartment: billingDefautAddress?.node?.addressLine2 || '',
              city: billingDefautAddress?.node?.city || '',
              state: billingDefautAddress?.node?.state || '',
              zipCode: billingDefautAddress?.node?.zipCode || '',
              phoneNumber: billingDefautAddress?.node?.phoneNumber || '',
            }

            quoteInfo.billingAddress = addressItem
          }

          setAddressList(addressB2BList)
        } else if (role !== 100) {
          const {
            customerAddresses: {
              edges: addressBCList = [],
            },
          } = await getBCCustomerAddresses()

          const list = addressBCList.map((address: BCAddress) => ({
            node: convertBCToB2BAddress(address.node),
          }))
          setAddressList(list)
        }

        if (quoteInfo && (!quoteInfo?.contactInfo || JSON.stringify(quoteInfo.contactInfo) === '{}') && +role !== 100) {
          setCustomInfo(quoteInfo)
        } else if (quoteInfo) {
          setInfo(quoteInfo)
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleSaveInfoClick = async () => {
    const saveInfo = {
      ...info,
    }
    if (contactInfoRef?.current) {
      saveInfo.contactInfo = await contactInfoRef.current.getContactInfoValue()
    }
    if (billingRef?.current) {
      saveInfo.billingAddress = billingRef.current.getContactInfoValue()
    }
    if (shippingRef?.current) {
      saveInfo.shippingAddress = shippingRef.current.getContactInfoValue()
    }

    const isComplete = Object.keys(saveInfo.contactInfo).every((key: string) => !!saveInfo.contactInfo[key])

    if (isComplete) {
      B3LStorage.set('MyQuoteInfo', saveInfo)
      setInfo(saveInfo)
      setEdit(false)
    }
  }

  const handleEditInfoClick = () => {
    setEdit(true)
  }

  const getDefaultCurrencyInfo = () => {
    const currencies = B3SStorage.get('currencies')
    if (currencies) {
      const {
        currencies: currencyArr,
      } = currencies

      const defaultCurrency = currencyArr.find((currency: CustomFieldItems) => currency.is_default)

      return defaultCurrency
    }
  }

  const {
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  const getQuoteTableDetails = async (params: CustomFieldItems) => {
    const quoteDraftAllList = B3LStorage.get('b2bQuoteDraftList') || []

    const startIndex = +params.offset
    const endIndex = +params.first + startIndex

    setTotal(quoteDraftAllList.length)
    if (!quoteDraftAllList.length) {
      return {
        edges: [],
        totalCount: 0,
      }
    }
    const list = quoteDraftAllList.slice(startIndex, endIndex)

    return {
      edges: list,
      totalCount: quoteDraftAllList.length,
    }
  }

  const accountFormFields = getAccountFormFields(isMobile)
  useEffect(() => {
    if (isRefresh) {
      // TODO list refresh function

      setIsRefresh(false)
    }
  }, [isRefresh])

  const updateList = () => {
    setIsRefresh(true)
  }

  const addToQuote = (products: CustomFieldItems[]) => {
    products.forEach((product) => {
      const {
        optionList,
        quantity,
        variantSku,
        productsSearch: {
          variants,
        },
      } = product.node
      const variantItem = variants.find((item: CustomFieldItems) => item.sku === variantSku)

      product.node.basePrice = variantItem.bc_calculated_price.as_entered
      product.node.tax = variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive

      const newOptionList = JSON.parse(optionList) || []

      addQuoteDraftProduce(product, quantity, newOptionList)
    })

    quoteTableRef.current?.refreshList()
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const info = B3LStorage.get('MyQuoteInfo')
      const contactInfo = info?.contactInfo || {}

      const isComplete = Object.keys(contactInfo).every((key: string) => !!contactInfo[key])

      if (JSON.stringify(contactInfo) === '{}' || !isComplete) {
        snackbar.error('Please fill in the Contact information')
        return
      }

      const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList')

      const emailAddress = B3SStorage.get('B3EmailAddress')

      const note = info?.note || ''

      const perfectAddress = (address: CustomFieldStringItems) => {
        const newAddress = {
          ...address,
        }

        const countryItem = countriesList?.find((item:Country) => item.countryCode === newAddress.country)

        if (countryItem) {
          newAddress.country = countryItem.countryName
        }

        newAddress.addressLine1 = address?.address || ''
        newAddress.addressLine2 = address?.apartment || ''

        delete newAddress.company

        return newAddress
      }

      const shippingAddress = info?.shippingAddress ? perfectAddress(info.shippingAddress) : {}

      const billingAddress = info?.billingAddress ? perfectAddress(info.billingAddress) : {}

      let allPrice = 0

      const productList = b2bQuoteDraftList.map((item: QuoteListitemProps) => {
        const {
          node,
        } = item
        const product: any = {
          ...node.productsSearch,
          selectOptions: node?.optionList || '',
        }

        const productFields = (getProductOptionsFields(product, {}))

        const optionsList: CustomFieldItems[] = productFields.map((item) => ({
          optionId: item.optionId,
          optionValue: item.optionValue,
          optionLabel: item.valueText,
          optionName: item.valueLabel,
        })).filter((list:CustomFieldItems) => !!list.optionName) || []

        const varants = node.productsSearch.variants
        const varantsItem = varants.find((item: CustomFieldItems) => item.sku === node.variantSku)

        allPrice += node.basePrice * node.quantity

        const items = {
          productId: node.productsSearch.id,
          sku: node.variantSku,
          basePrice: node.basePrice.toFixed(2),
          discount: '0.00',
          offeredPrice: node.basePrice.toFixed(2),
          quantity: node.quantity,
          variantId: varantsItem.variant_id,
          imageUrl: node.primaryImage,
          productName: node.productName,
          options: optionsList,
        }

        return items
      })

      const getDefaultCurrencyInfo = () => {
        const currencies = B3SStorage.get('currencies')
        if (currencies) {
          const {
            currencies: currencyArr,
          } = currencies
          const defaultCurrency = currencyArr.find((currency: any) => currency.is_default)
          return defaultCurrency
        }
      }

      const currency = getDefaultCurrencyInfo()

      const data = {
        notes: note,
        legalTerms: '',
        totalAmount: allPrice.toFixed(2),
        grandTotal: allPrice.toFixed(2),
        subtotal: allPrice.toFixed(2),
        companyId: isB2BUser ? companyB2BId || salesRepCompanyId : '',
        storeHash,
        discount: '0.00',
        channelId,
        userEmail: emailAddress,
        shippingAddress,
        billingAddress,
        contactInfo,
        productList,
        currency: {
          currencyExchangeRate: currency.currency_exchange_rate,
          token: currency.token,
          location: currency.token_location,
          decimalToken: currency.decimal_token,
          decimalPlaces: currency.decimal_places,
          thousandsToken: currency.thousands_token,
          currencyCode: currency.currency_code,
        },
      }

      const fn = +role === 99 ? createBCQuote : createQuote

      const {
        quoteCreate: {
          quote: {
            id,
            createdAt,
          },
        },
      } = await fn(data)

      navigate(`/quoteDetail/${id}?date=${createdAt}`, {
        state: {
          to: 'draft',
        },
      })

      B3LStorage.delete('b2bQuoteDraftList')
      B3LStorage.delete('MyQuoteInfo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <B3Sping
      isSpinning={loading}
    >
      <Box
        sx={{
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '8px',
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontSize: '24px',
                mr: '1rem',
              }}
            >
              Quote
            </Typography>
            <QuoteStatus code="0" />
          </Box>
          <Button
            variant="contained"
            size="small"
            sx={{
              height: '35px',
            }}
            onClick={handleSubmit}
          >
            submit
          </Button>
        </Box>

        <Box>
          {
          !isEdit && (
          <QuoteInfo
            contactInfo={info?.contactInfo || {}}
            shippingAddress={info?.shippingAddress || {}}
            billingAddress={info?.billingAddress || {}}
            handleEditInfoClick={handleEditInfoClick}
          />
          )
        }
          {
          isEdit && (
          <Container
            flexDirection="column"
          >
            <ContactInfo
              info={info.contactInfo}
              ref={contactInfoRef}
            />
            <Box
              sx={{
                display: 'flex',
                mt: isMobile ? 0 : '3rem',
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <QuoteAddress
                title="Billing"
                info={info?.billingAddress || {}}
                addressList={addressList}
                pr={isMobile ? 0 : '8px'}
                ref={billingRef}
                role={role}
                accountFormFields={accountFormFields}
              />
              <QuoteAddress
                title="Shipping"
                info={info?.shippingAddress || {}}
                addressList={addressList}
                pl={isMobile ? 0 : '8px'}
                ref={shippingRef}
                role={role}
                accountFormFields={accountFormFields}
              />
            </Box>
            <Button
              sx={{
                mt: '20px',
                mb: '15px',
              }}
              onClick={handleSaveInfoClick}
              variant="outlined"
            >
              Save info

            </Button>
          </Container>
          )
        }
        </Box>
        <Box
          sx={{
            mt: '20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'flex-start',
          }}
        >
          <Container
            flexDirection="column"
            xs={{
              flexBasis: isMobile ? '100%' : '680px',
              flexGrow: 1,
              marginRight: '20px',
              marginBottom: '20px',
            }}
          >
            <QuoteTable
              ref={quoteTableRef}
              total={total}
              currencyToken={currencyToken}
              getQuoteTableDetails={getQuoteTableDetails}
            />

          </Container>

          <Container
            flexDirection="column"
            xs={{
              flexBasis: isMobile ? '100%' : '340px',
              marginBottom: '20px',
              backgroundColor: 'transparent',
              padding: 0,
            }}
          >
            <Stack
              spacing={2}
              sx={{
                width: '100%',
              }}
            >
              <QuoteSummary
                currencyToken={currencyToken}
                isRefresh={isRefresh}
              />
              <AddToQuote
                updateList={updateList}
                addToQuote={addToQuote}
              />

              <QuoteNote />

              <QuoteAttachment />
            </Stack>
          </Container>
        </Box>
      </Box>
    </B3Sping>
  )
}

export default QuoteDraft