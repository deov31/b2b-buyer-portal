import {
  useNavigate,
} from 'react-router-dom'
import {
  format,
} from 'date-fns'

import {
  Box,
  Grid,
  styled,
  Typography,
  Button,
} from '@mui/material'

import {
  ArrowBackIosNew,
} from '@mui/icons-material'

import {
  QuoteStatus,
} from './QuoteStatus'

import {
  useMobile,
} from '@/hooks'

const StyledCreateName = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
}))

interface QuoteDetailHeaderProps {
  status: string,
  quoteNumber: string,
  issuedAt: number,
  expirationDate: number,
  exportPdf: () => void,
  role: number | string,
}

const QuoteDetailHeader = (props: QuoteDetailHeaderProps) => {
  const [isMobile] = useMobile()

  const {
    status,
    quoteNumber,
    issuedAt,
    expirationDate,
    exportPdf,
    role,
  } = props

  const navigate = useNavigate()
  const gridOptions = (xs: number) => (isMobile ? {} : {
    xs,
  })

  const printQuote = () => {
    const iframe = document.querySelector('iframe')

    if (iframe) {
      iframe?.contentWindow?.print()
    }
  }

  return (
    <>
      {
        +role !== 100 && (
          <Box
            sx={{
              marginBottom: '10px',
              width: 'fit-content',
              displayPrint: 'none',
            }}
          >
            <Box
              sx={{
                color: '#1976d2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={() => {
                navigate('/quotes')
              }}
            >
              <ArrowBackIosNew
                fontSize="small"
                sx={{
                  fontSize: '12px',
                  marginRight: '0.5rem',
                }}
              />
              <p>Back to quote lists</p>
            </Box>
          </Box>
        )
      }

      <Grid
        container
        spacing={2}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: `${isMobile ? 'column' : 'row'}`,
          mb: `${isMobile ? '16px' : ''}`,
        }}
      >
        <Grid
          item
          {...gridOptions(8)}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: `${isMobile ? 'start' : 'center'}`,
              flexDirection: `${isMobile ? 'column' : 'row'}`,
            }}
          >
            <Typography
              sx={{
                marginRight: '10px',
                fontSize: '34px',
                color: '#263238',
              }}
            >
              {`Quote #${quoteNumber || ''}`}
            </Typography>

            <QuoteStatus code={status} />
          </Box>
          <Box>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                Issued on:
              </Typography>
              <span>{`${issuedAt ? format(+issuedAt * 1000, 'dd MMM yy') : ''}`}</span>
            </StyledCreateName>
            <StyledCreateName>
              <Typography
                variant="subtitle2"
                sx={{
                  marginRight: '0.5rem',
                  fontSize: '16px',
                }}
              >
                Expiration date:
              </Typography>
              <span>{`${expirationDate ? format(+expirationDate * 1000, 'dd MMM yy') : ''}`}</span>
            </StyledCreateName>
          </Box>
        </Grid>
        {
          +role !== 100 && (
            <Grid
              item
              sx={{
                textAlign: `${isMobile ? 'none' : 'end'}`,
                displayPrint: 'none',
              }}
              {...gridOptions(4)}
            >
              <Box>
                <Button
                  variant="outlined"
                  sx={{
                    marginRight: '1rem',
                    displayPrint: 'none',
                  }}
                  onClick={printQuote}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  onClick={exportPdf}
                >
                  DownLoad pdf
                </Button>
              </Box>
            </Grid>
          )
        }

      </Grid>
    </>
  )
}

export default QuoteDetailHeader