import {
  useEffect,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  ImageListItem,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  getBCRegisterCustomFields,
} from '@/shared/service/bc'
import {
  getB2BRegisterCustomFields,
  getB2BRegisterLogo,
  getB2BCountries,
  storeB2BBasicInfo,
} from '@/shared/service/b2b'

import RegisteredStep from './RegisteredStep'
import RegisterContent from './RegisterContent'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  conversionDataFormat,
  bcContactInformationFields,
  RegisterFields,
  contactInformationFields,
  getRegisterLogo,
  companyInformationFields,
  companyAttachmentsFields,
  addressInformationFields,
} from './config'

import {
  RegisteredContainer, RegisteredImage,
} from './styled'

interface RegisteredProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>,
}

export default function Registered(props: RegisteredProps) {
  const {
    setIsOpen,
  } = props
  const [activeStep, setActiveStep] = useState(0)

  const [logo, setLogo] = useState('')

  const b3Lang = useB3Lang()

  const {
    state: {
      isLoading,
    },
    dispatch,
  } = useContext(RegisteredContext)

  useEffect(() => {
    const getBCAdditionalFields = async () => {
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          })
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: false,
            },
          })
        }

        const {
          customerAccount,
          billingAddress,
        } = await getBCRegisterCustomFields()
        const {
          companyExtraFields,
        } = await getB2BRegisterCustomFields()
        const {
          quoteConfig,
        } = await getB2BRegisterLogo()
        const {
          countries,
        } = await getB2BCountries()
        const {
          storeBasicInfo: {
            storeName,
          },
        } = await storeB2BBasicInfo()
        const registerLogo = getRegisterLogo(quoteConfig)

        const newCustomerAccount = customerAccount.length ? customerAccount.filter((field: RegisterFields) => field.custom) : []
        const newAdditionalInformation: Array<RegisterFields> = conversionDataFormat(newCustomerAccount)

        const filterCompanyExtraFields = companyExtraFields.length ? companyExtraFields.filter((field: RegisterFields) => field?.visibleToEnduser) : []
        const newCompanyExtraFields: Array<RegisterFields> = conversionDataFormat(filterCompanyExtraFields)

        const customAddress = billingAddress.length ? billingAddress.filter((field: RegisterFields) => field.custom) : []
        const addressExtraFields: Array<RegisterFields> = conversionDataFormat(customAddress)

        const newAddressInformationFields = addressInformationFields(b3Lang).map((addressFields) => {
          if (addressFields.name === 'country') {
            addressFields.options = countries
          }
          return addressFields
        })

        const filterPasswordInformation = customerAccount.length ? customerAccount.filter((field: RegisterFields) => !field.custom && field.fieldType === 'password') : []
        const newPasswordInformation: Array<RegisterFields> = conversionDataFormat(filterPasswordInformation)
        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
              isLoading: false,
              storeName,
              contactInformation: [...contactInformationFields(b3Lang)],
              additionalInformation: [...newAdditionalInformation],
              bcContactInformationFields: [...bcContactInformationFields(b3Lang)],
              companyExtraFields: [...newCompanyExtraFields],
              companyInformation: [...companyInformationFields(b3Lang)],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields],
              addressExtraFields: [...addressExtraFields],
              countryList: [...countries],
              passwordInformation: [...newPasswordInformation],
            },
          })
        }
        setLogo(registerLogo)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const isStepOptional = (step: number) => step === -1

  const handleNext = async () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
  }

  const handleFinish = () => {
    if (dispatch) {
      dispatch({
        type: 'all',
        payload: {
          accountType: '',
          isLoading: false,
          storeName: '',
          submitSuccess: false,
          contactInformation: [],
          additionalInformation: [],
          bcContactInformationFields: [],
          companyExtraFields: [],
          companyInformation: [],
          companyAttachment: [],
          addressBasicFields: [],
          addressExtraFields: [],
          countryList: [],
          passwordInformation: [],
        },
      })
    }

    setIsOpen(false)
  }

  return (
    <RegisteredContainer>
      <B3Sping
        isSpinning={isLoading}
        tip={b3Lang('intl.global.tips.loading')}
      >
        {
          logo && (
          <RegisteredImage>
            <ImageListItem sx={{
              maxWidth: '130px',
              maxHeight: '130px',
            }}
            >
              <img
                src={`${logo}`}
                alt={b3Lang('intl.user.register.tips.registerLogo')}
                loading="lazy"
              />
            </ImageListItem>
          </RegisteredImage>
          )
        }
        <RegisteredStep
          activeStep={activeStep}
          isStepOptional={isStepOptional}
        >
          <RegisterContent
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
            handleFinish={handleFinish}
          />
        </RegisteredStep>
      </B3Sping>
    </RegisteredContainer>
  )
}