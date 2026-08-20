import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Database,
  Landmark,
  Layers3,
  List,
  RefreshCw,
  Send,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const PUBLIC_API_BASE = 'https://api.flapapay.com';
const DEFAULT_API_KEY = 'flp_live_sk_xxx';
const DEFAULT_CONTENT_TYPE = 'application/json';

type HttpMethod = 'GET' | 'POST' | 'DELETE';
type CodeLanguage = 'curl' | 'node' | 'python' | 'php' | 'ruby' | 'shell' | 'java';

type DocEndpoint = {
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  auth?: string;
  params?: Array<{
    name: string;
    type: string;
    required?: boolean;
    location?: 'body' | 'query' | 'path' | 'header';
    description: string;
  }>;
  requestExample?: string;
  responseExample?: string;
};

type DocPage = {
  slug: string;
  title: string;
  summary: string;
  group: 'Getting Started' | 'Accounts & Banks' | 'Collections' | 'Hosted Checkout' | 'Disbursements' | 'Webhooks' | 'Encryption' | 'Reporting';
  icon: React.ReactNode;
  parentSlug?: string;
  intro: string[];
  bullets?: string[];
  exampleTitle?: string;
  exampleLanguage?: string;
  exampleCode?: string;
  endpoint?: DocEndpoint;
};

const methodClassMap: Record<HttpMethod, string> = {
  GET: 'border border-blue-400/30 bg-blue-500/10 text-blue-200',
  POST: 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  DELETE: 'border border-rose-400/30 bg-rose-500/10 text-rose-200',
};

const languageLabels: Record<CodeLanguage, string> = {
  curl: 'cURL',
  node: 'Node',
  python: 'Python',
  php: 'PHP',
  ruby: 'Ruby',
  shell: 'Shell',
  java: 'Java',
};

const pages: DocPage[] = [
  {
    slug: 'introduction',
    title: 'Introduction',
    summary: 'Overview of the FlapaPay API and how merchants authenticate.',
    group: 'Getting Started',
    icon: <BookOpen className="h-4 w-4" />,
    intro: [
      'FlapaPay exposes a merchant API for collections, disbursements, banks, account resolution, recipients, and settlement reporting.',
      'All endpoints are authenticated with merchant API keys issued from Merchant Hub. Collections and transfers update merchant wallets and ledger entries as transactions progress.',
    ],
    bullets: [
      'Base URL: https://api.flapapay.com',
      'Authentication: Bearer merchant secret key',
      'Hosted checkout remains available for card and subscription flows',
      'Reference endpoints return FlapaPay-normalized transaction objects',
    ],
  },
  {
    slug: 'banks',
    title: 'Banks',
    summary: 'Retrieve supported banks and financial institutions.',
    group: 'Accounts & Banks',
    icon: <Landmark className="h-4 w-4" />,
    intro: [
      'Use the banks resource to fetch institutions supported for account resolution and bank disbursements.',
      'Filter by country where needed so your client only shows rails available to the merchant or customer.',
    ],
    bullets: [
      'Recommended before collecting bank account details',
      'Pairs with Resolve Bank Account',
      'Returns FlapaPay-normalized bank objects',
    ],
  },
  {
    slug: 'get-banks',
    title: 'Get Banks',
    summary: 'List supported banks and institutions.',
    group: 'Accounts & Banks',
    parentSlug: 'banks',
    icon: <List className="h-4 w-4" />,
    intro: [
      'This endpoint returns supported banks and financial institutions for a country.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/banks',
      summary: 'Get banks',
      description: 'Returns supported banks and financial institutions. Use the optional country query to scope the results.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'country',
          type: 'string',
          location: 'query',
          description: 'Optional country code such as zm.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/banks?country=zm' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Banks fetched successfully",
  "data": [
    {
      "id": "002",
      "name": "Absa Bank",
      "country": "zm"
    }
  ]
}`,
    },
  },
  {
    slug: 'resolve-bank-account',
    title: 'Resolve Bank Account',
    summary: 'Verify account number and resolve account name.',
    group: 'Accounts & Banks',
    parentSlug: 'banks',
    icon: <Building2 className="h-4 w-4" />,
    intro: [
      'Resolve a bank account before creating a recipient or sending a bank disbursement.',
      'The response includes the resolved account name and bank details.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/resolve/bank-account',
      summary: 'Resolve bank account',
      description: 'Verifies and resolves bank account details for supported countries.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'accountNumber',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Customer or recipient account number.',
        },
        {
          name: 'bankId',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Bank identifier returned by the banks endpoint.',
        },
        {
          name: 'country',
          type: 'string',
          location: 'body',
          description: 'Optional country code such as zm.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/resolve/bank-account' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "accountNumber": "9130000000000",
    "bankId": "002",
    "country": "zm"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Account resolved successfully",
  "data": {
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bank": {
      "id": "002",
      "name": "Absa Bank",
      "country": "zm"
    }
  }
}`,
    },
  },
  {
    slug: 'transfer-recipients',
    title: 'Transfer Recipients',
    summary: 'Store and manage payout destinations for merchants.',
    group: 'Accounts & Banks',
    icon: <Layers3 className="h-4 w-4" />,
    intro: [
      'Recipients let merchants save verified bank or mobile money destinations for faster transfers.',
      'Create a recipient once, then reuse the identifier when creating disbursements.',
    ],
    bullets: [
      'Supports reusable payout destinations',
      'Works with bank and mobile money transfer flows',
      'Recipient endpoints are authenticated with merchant API keys',
    ],
  },
  {
    slug: 'list-transfer-recipients',
    title: 'List Transfer Recipients',
    summary: 'Fetch saved recipients for the merchant.',
    group: 'Accounts & Banks',
    parentSlug: 'transfer-recipients',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Retrieve saved recipients belonging to the authenticated merchant.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/transfer-recipients',
      summary: 'List transfer recipients',
      description: 'Returns stored payout recipients for the merchant account.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/transfer-recipients' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Recipients fetched successfully",
  "data": [
    {
      "id": "rec_123",
      "type": "bank-account",
      "accountName": "Beata Jean",
      "accountNumber": "9130000000000",
      "bankId": "002",
      "bankName": "Absa Bank",
      "createdAt": "2026-07-30T10:30:00.000Z"
    }
  ]
}`,
    },
  },
  {
    slug: 'create-transfer-recipient',
    title: 'Create Transfer Recipient',
    summary: 'Create and store a payout recipient.',
    group: 'Accounts & Banks',
    parentSlug: 'transfer-recipients',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Create a recipient after resolving the destination account or mobile money line.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/transfer-recipients',
      summary: 'Create transfer recipient',
      description: 'Creates a reusable payout recipient for later transfer requests.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'type',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Destination type such as bank-account or mobile-money.',
        },
        {
          name: 'accountName',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Resolved account or wallet holder name.',
        },
        {
          name: 'accountNumber',
          type: 'string',
          location: 'body',
          description: 'Bank account number for bank-account recipients.',
        },
        {
          name: 'bankId',
          type: 'string',
          location: 'body',
          description: 'Bank identifier for bank-account recipients.',
        },
        {
          name: 'phone',
          type: 'string',
          location: 'body',
          description: 'Phone number for mobile-money recipients.',
        },
        {
          name: 'operator',
          type: 'string',
          location: 'body',
          description: 'Mobile money operator for mobile-money recipients.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/transfer-recipients' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bankId": "002"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Recipient created successfully",
  "data": {
    "id": "rec_123",
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bankId": "002"
  }
}`,
    },
  },
  {
    slug: 'get-transfer-recipient',
    title: 'Get Transfer Recipient',
    summary: 'Fetch one saved recipient by identifier.',
    group: 'Accounts & Banks',
    parentSlug: 'transfer-recipients',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Use this endpoint to retrieve a specific recipient saved on the merchant account.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/transfer-recipients/:id',
      summary: 'Get transfer recipient',
      description: 'Returns one stored payout recipient by its identifier.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'id',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Recipient identifier returned when it was created.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/transfer-recipients/rec_123' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Recipient fetched successfully",
  "data": {
    "id": "rec_123",
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bankId": "002",
    "bankName": "Absa Bank"
  }
}`,
    },
  },
  {
    slug: 'delete-transfer-recipient',
    title: 'Delete Transfer Recipient',
    summary: 'Remove a saved payout destination.',
    group: 'Accounts & Banks',
    parentSlug: 'transfer-recipients',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Delete a recipient when it should no longer be available for merchant disbursements.',
    ],
    endpoint: {
      method: 'DELETE',
      path: '/v1/transfer-recipients/:id',
      summary: 'Delete transfer recipient',
      description: 'Deletes a saved payout recipient for the merchant.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'id',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Recipient identifier to delete.',
        },
      ],
      requestExample: `curl --request DELETE '${PUBLIC_API_BASE}/v1/transfer-recipients/rec_123' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Recipient deleted successfully",
  "data": null
}`,
    },
  },
  {
    slug: 'mobile-money-collections',
    title: 'Mobile Money Collections',
    summary: 'Request collections from customer mobile money wallets.',
    group: 'Collections',
    icon: <Smartphone className="h-4 w-4" />,
    intro: [
      'Mobile money collections prompt the customer to approve payment on their device.',
      'Successful collections credit the merchant wallet and write ledger entries for settlement and reporting.',
    ],
    bullets: [
      'Use resolve before disbursements, not before collections',
      'Track collection outcomes through list and detail endpoints',
      'Wallets and ledger entries remain the source of settlement truth',
    ],
  },
  {
    slug: 'resolve-mobile-money',
    title: 'Resolve Mobile Money',
    summary: 'Verify a mobile money line and resolve account name.',
    group: 'Collections',
    parentSlug: 'mobile-money-collections',
    icon: <Smartphone className="h-4 w-4" />,
    intro: [
      'Resolve a mobile money number when you need to confirm the account name before using it as a payout destination.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/resolve/mobile-money',
      summary: 'Resolve mobile money',
      description: 'Verifies a mobile money number and returns the account name where supported.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'phone',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Mobile money phone number.',
        },
        {
          name: 'operator',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Operator such as airtel, mtn, or zamtel.',
        },
        {
          name: 'country',
          type: 'string',
          location: 'body',
          description: 'Optional country code such as zm.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/resolve/mobile-money' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "phone": "0961111111",
    "operator": "mtn",
    "country": "zm"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Account resolved successfully",
  "data": {
    "type": "mobile-money",
    "accountName": "Beata Jean",
    "phone": "0961111111",
    "operator": "mtn",
    "country": "zm"
  }
}`,
    },
  },
  {
    slug: 'create-mobile-money-collection',
    title: 'Create Mobile Money Collection',
    summary: 'Initiate a mobile money payment request.',
    group: 'Collections',
    parentSlug: 'mobile-money-collections',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Create a mobile money collection to request payment from a customer phone number.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/collections/mobile-money',
      summary: 'Create mobile money collection',
      description: 'Requests a mobile money collection and tracks it against the merchant wallet and ledger.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          location: 'body',
          description: 'Collection amount.',
        },
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Merchant-supplied unique collection reference.',
        },
        {
          name: 'phone',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Customer mobile money phone number.',
        },
        {
          name: 'operator',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Operator such as airtel, mtn, or zamtel.',
        },
        {
          name: 'country',
          type: 'string',
          location: 'body',
          description: 'Optional country code such as zm.',
        },
        {
          name: 'bearer',
          type: 'string',
          location: 'body',
          description: 'Either merchant or customer for fee bearing.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/collections/mobile-money' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 13,
    "reference": "ref-1",
    "phone": "0977433571",
    "operator": "airtel",
    "country": "zm",
    "bearer": "merchant"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Collection created successfully",
  "data": {
    "reference": "ref-1",
    "type": "mobile-money",
    "status": "pay-offline",
    "amount": "13.00",
    "currency": "ZMW",
    "settlementStatus": "pending"
  }
}`,
    },
  },
  {
    slug: 'card-collections',
    title: 'Card Collections',
    summary: 'Accept card payments through the FlapaPay collections layer.',
    group: 'Collections',
    icon: <CreditCard className="h-4 w-4" />,
    intro: [
      'Card collections give merchants a direct API resource for server-side payment creation, while hosted checkout remains available for redirect-based flows.',
      'Successful card collections settle into the merchant wallet and create ledger entries in the same way as other collections.',
    ],
  },
  {
    slug: 'create-card-collection',
    title: 'Create Card Collection',
    summary: 'Create a direct card collection.',
    group: 'Collections',
    parentSlug: 'card-collections',
    icon: <CreditCard className="h-4 w-4" />,
    intro: [
      'Use this endpoint when you need a direct FlapaPay card collection resource instead of hosted checkout.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/collections/card',
      summary: 'Create card collection',
      description: 'Creates a card collection and normalizes the result into the FlapaPay collections model.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          location: 'body',
          description: 'Amount to collect.',
        },
        {
          name: 'currency',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Currency code such as ZMW or USD.',
        },
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Merchant-defined unique reference.',
        },
        {
          name: 'card',
          type: 'object',
          required: true,
          location: 'body',
          description: 'Tokenized card or direct card payload depending on integration mode.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/collections/card' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 50000,
    "currency": "ZMW",
    "reference": "card-001",
    "card": {
      "number": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2030",
      "cvv": "123"
    }
  }'`,
      responseExample: `{
  "status": true,
  "message": "Collection created successfully",
  "data": {
    "reference": "card-001",
    "type": "card",
    "status": "successful",
    "amount": "50000.00",
    "currency": "ZMW",
    "settlementStatus": "settled"
  }
}`,
    },
  },
  {
    slug: 'list-collections',
    title: 'List Collections',
    summary: 'Retrieve collection records for the merchant.',
    group: 'Collections',
    parentSlug: 'mobile-money-collections',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Use the collections index to fetch card and mobile money collections in one normalized stream.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/collections',
      summary: 'List collections',
      description: 'Returns the merchant collection stream across supported payment rails.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/collections' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Collections fetched successfully",
  "data": [
    {
      "reference": "ref-1",
      "type": "mobile-money",
      "status": "successful",
      "amount": "13.00",
      "currency": "ZMW",
      "settlementStatus": "settled"
    },
    {
      "reference": "card-001",
      "type": "card",
      "status": "successful",
      "amount": "50000.00",
      "currency": "ZMW",
      "settlementStatus": "settled"
    }
  ]
}`,
    },
  },
  {
    slug: 'get-collection',
    title: 'Get Collection',
    summary: 'Retrieve one collection by reference.',
    group: 'Collections',
    parentSlug: 'mobile-money-collections',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Fetch one collection record to inspect payment and settlement status.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/collections/:reference',
      summary: 'Get collection',
      description: 'Returns one collection record by reference.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Collection reference.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/collections/ref-1' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Collection fetched successfully",
  "data": {
    "reference": "ref-1",
    "type": "mobile-money",
    "status": "successful",
    "amount": "13.00",
    "currency": "ZMW",
      "settlementStatus": "settled"
  }
}`,
    },
  },
  {
    slug: 'hosted-checkout',
    title: 'Hosted Checkout',
    summary: 'Use the FlapaPay checkout gateway for redirect-based payment flows.',
    group: 'Hosted Checkout',
    icon: <CreditCard className="h-4 w-4" />,
    intro: [
      'Hosted Checkout is the FlapaPay redirect flow that opens the public gateway page rendered by the checkout route.',
      'It is the right choice when you want FlapaPay to own the payment experience while your integration creates sessions and redirects customers to the checkout page.',
    ],
    bullets: [
      'Gateway route: /checkout/:id',
      'Works for merchant checkout session flows',
      'Settles into merchant wallets and ledger entries after successful payment',
    ],
  },
  {
    slug: 'create-checkout-session',
    title: 'Create Checkout Session',
    summary: 'Create a hosted checkout session for the FlapaPay gateway.',
    group: 'Hosted Checkout',
    parentSlug: 'hosted-checkout',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Create a checkout session to generate the customer-facing hosted payment page that opens under the FlapaPay gateway.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/checkout/sessions',
      summary: 'Create checkout session',
      description: 'Creates a hosted checkout session and returns the gateway URL the merchant should redirect the customer to.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'mode',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Checkout mode such as payment or subscription.',
        },
        {
          name: 'line_items',
          type: 'array',
          required: true,
          location: 'body',
          description: 'Line items to purchase in the checkout session.',
        },
        {
          name: 'customer_email',
          type: 'string',
          location: 'body',
          description: 'Optional customer email to prefill on the hosted checkout page.',
        },
        {
          name: 'success_url',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Redirect URL after successful checkout.',
        },
        {
          name: 'cancel_url',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Redirect URL if the customer cancels checkout.',
        },
        {
          name: 'metadata',
          type: 'object',
          location: 'body',
          description: 'Optional metadata attached to the checkout session.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/checkout/sessions' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "mode": "payment",
    "customer_email": "customer@example.com",
    "line_items": [
      {
        "price_data": {
          "currency": "ZMW",
          "product_data": { "name": "Starter Plan" },
          "unit_amount": 50000
        },
        "quantity": 1
      }
    ],
    "success_url": "https://yourapp.com/success",
    "cancel_url": "https://yourapp.com/cancel"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Checkout session created successfully",
  "data": {
    "id": "cs_test_123",
    "url": "https://www.flapapay.com/checkout/cs_test_123",
    "mode": "payment",
    "status": "open",
    "currency": "ZMW"
  }
}`,
    },
  },
  {
    slug: 'get-checkout-session',
    title: 'Get Checkout Session',
    summary: 'Retrieve one checkout session by identifier.',
    group: 'Hosted Checkout',
    parentSlug: 'hosted-checkout',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Use this endpoint to inspect checkout session state after redirect or payment completion.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/checkout/sessions/:id',
      summary: 'Get checkout session',
      description: 'Returns the state and payment status of a hosted checkout session.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'id',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Checkout session identifier.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/checkout/sessions/cs_test_123' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Checkout session fetched successfully",
  "data": {
    "id": "cs_test_123",
    "mode": "payment",
    "status": "complete",
    "payment_status": "paid",
    "currency": "ZMW",
  "amount_total": 50000
  }
}`,
    },
  },
  {
    slug: 'checkout-redirect-handling',
    title: 'Handle Checkout Redirects',
    summary: 'Process the customer return flow after hosted checkout completes or is cancelled.',
    group: 'Hosted Checkout',
    parentSlug: 'hosted-checkout',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'After the customer leaves the FlapaPay gateway, your application should read the returned session identifier and fetch the session state from the API before showing a final status screen.',
      'This is the recommended pattern for success and cancel URLs because it prevents your frontend from trusting query parameters alone.',
    ],
    bullets: [
      'Append the checkout session identifier to your success URL',
      'Fetch the session from the API before marking payment as complete',
      'Use the cancel URL for abandoned or cancelled payment flows',
    ],
  },
  {
    slug: 'checkout-webhooks',
    title: 'Checkout Webhooks',
    summary: 'Use server-to-server events to confirm hosted checkout outcomes.',
    group: 'Hosted Checkout',
    parentSlug: 'hosted-checkout',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Redirect handling improves the customer experience, but webhooks should remain the source of truth for backend fulfillment.',
      'Listen for checkout-related events so you can update orders, subscriptions, and internal records even if the customer never returns to your site.',
    ],
    bullets: [
      'Use webhooks for final fulfillment logic',
      'Keep redirect pages lightweight and customer-facing',
      'Verify webhook signatures before processing events',
    ],
  },
  {
    slug: 'bank-disbursements',
    title: 'Bank Disbursements',
    summary: 'Send funds from the merchant wallet to bank accounts.',
    group: 'Disbursements',
    icon: <Wallet className="h-4 w-4" />,
    intro: [
      'Bank disbursements debit the merchant wallet, create ledger entries, and track the transfer lifecycle under a FlapaPay reference.',
      'Resolve and optionally save recipients before creating a bank transfer.',
    ],
  },
  {
    slug: 'create-bank-disbursement',
    title: 'Create Bank Disbursement',
    summary: 'Initiate a transfer to a bank account.',
    group: 'Disbursements',
    parentSlug: 'bank-disbursements',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Use this endpoint to transfer funds from the merchant wallet to a bank account.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/transfers/bank-account',
      summary: 'Create bank disbursement',
      description: 'Initiates a bank transfer, debits the merchant wallet, and records the transfer in the FlapaPay ledger.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          location: 'body',
          description: 'Transfer amount.',
        },
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Merchant-defined unique transfer reference.',
        },
        {
          name: 'accountId',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Merchant wallet or operating account identifier to debit.',
        },
        {
          name: 'transferRecipientId',
          type: 'string',
          location: 'body',
          description: 'Optional saved recipient identifier.',
        },
        {
          name: 'accountNumber',
          type: 'string',
          location: 'body',
          description: 'Use with bankId when not sending to a saved recipient.',
        },
        {
          name: 'bankId',
          type: 'string',
          location: 'body',
          description: 'Use with accountNumber when not sending to a saved recipient.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/transfers/bank-account' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "accountId": "wal_001",
    "amount": 20,
    "reference": "bank-001",
    "transferRecipientId": "rec_123"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Transfer initiated successfully",
  "data": {
    "reference": "bank-001",
    "type": "bank-account",
    "status": "pending",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "settlementStatus": "pending"
  }
}`,
    },
  },
  {
    slug: 'mobile-money-disbursements',
    title: 'Mobile Money Disbursements',
    summary: 'Send funds from the merchant wallet to mobile money destinations.',
    group: 'Disbursements',
    icon: <Smartphone className="h-4 w-4" />,
    intro: [
      'Mobile money disbursements work like bank transfers but route to supported wallet operators.',
      'Merchant wallets are debited first and the transfer lifecycle is tracked under FlapaPay references.',
    ],
  },
  {
    slug: 'create-mobile-money-disbursement',
    title: 'Create Mobile Money Disbursement',
    summary: 'Initiate a transfer to a mobile money wallet.',
    group: 'Disbursements',
    parentSlug: 'mobile-money-disbursements',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Use this endpoint to transfer funds from the merchant wallet to a supported mobile money destination.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/transfers/mobile-money',
      summary: 'Create mobile money disbursement',
      description: 'Initiates a mobile money transfer and records it under the FlapaPay wallet and ledger model.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          location: 'body',
          description: 'Transfer amount.',
        },
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Merchant-defined unique transfer reference.',
        },
        {
          name: 'phone',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Destination mobile money phone number.',
        },
        {
          name: 'operator',
          type: 'string',
          required: true,
          location: 'body',
          description: 'Destination operator such as airtel, mtn, or zamtel.',
        },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/transfers/mobile-money' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 50,
    "reference": "mm-001",
    "phone": "0977000000",
    "operator": "airtel",
    "country": "zm"
  }'`,
      responseExample: `{
  "status": true,
  "message": "Transfer initiated successfully",
  "data": {
    "reference": "mm-001",
    "type": "mobile-money",
    "status": "pending",
    "amount": "50.00",
    "currency": "ZMW",
    "settlementStatus": "pending"
  }
}`,
    },
  },
  {
    slug: 'list-transfers',
    title: 'List Transfers',
    summary: 'Fetch merchant disbursements across supported payout rails.',
    group: 'Disbursements',
    parentSlug: 'bank-disbursements',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Use the transfers index to retrieve bank and mobile money disbursements in one stream.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/transfers',
      summary: 'List transfers',
      description: 'Returns the transfer stream for the authenticated merchant.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/transfers' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Transfers fetched successfully",
  "data": [
    {
      "reference": "bank-001",
      "type": "bank-account",
      "status": "successful",
      "amount": "20.00",
      "currency": "ZMW"
    },
    {
      "reference": "mm-001",
      "type": "mobile-money",
      "status": "pending",
      "amount": "50.00",
      "currency": "ZMW"
    }
  ]
}`,
    },
  },
  {
    slug: 'get-transfer',
    title: 'Get Transfer',
    summary: 'Retrieve one transfer by reference.',
    group: 'Disbursements',
    parentSlug: 'bank-disbursements',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Fetch one transfer record to inspect status, fee, and payout destination details.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/transfers/:reference',
      summary: 'Get transfer',
      description: 'Returns one transfer record by reference.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Transfer reference.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/transfers/bank-001' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Transfer fetched successfully",
  "data": {
    "reference": "bank-001",
    "type": "bank-account",
    "status": "successful",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW"
  }
}`,
    },
  },
  {
    slug: 'webhooks',
    title: 'Webhooks',
    summary: 'Listen for FlapaPay events as collections, transfers, payouts, and settlements change state.',
    group: 'Webhooks',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'FlapaPay sends webhook events to your server whenever important actions happen on your merchant account or API integration.',
      'Use webhooks for backend confirmation, fulfillment, ledger synchronization, and operational monitoring. Redirects improve customer experience, but webhooks should remain the source of truth.',
    ],
    bullets: [
      'Register one or more HTTPS endpoints per merchant account',
      'Verify the x-flapapay-signature header on every event',
      'Return a 2xx response quickly and process long work asynchronously',
      'Use delivery logs, test delivery, and retry APIs from Merchant Hub or API',
    ],
  },
  {
    slug: 'list-webhook-endpoints',
    title: 'List Webhook Endpoints',
    summary: 'Fetch webhook endpoints registered for the merchant.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Retrieve the webhook endpoints currently registered for the authenticated merchant.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/webhooks',
      summary: 'List webhook endpoints',
      description: 'Returns registered webhook endpoints, subscribed events, enablement state, and creation metadata.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/webhooks' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `[
  {
    "id": "wh_123",
    "url": "https://merchant.example.com/webhooks/flapapay",
    "events": ["collection.successful", "transfer.successful"],
    "enabled": true,
    "description": "Production listener",
    "created_at": "2026-07-30T12:00:00.000Z"
  }
]`,
    },
  },
  {
    slug: 'create-webhook-endpoint',
    title: 'Create Webhook Endpoint',
    summary: 'Register a new webhook destination and receive its signing secret.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Create a webhook endpoint to start receiving FlapaPay events on your server.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/webhooks',
      summary: 'Create webhook endpoint',
      description: 'Registers a webhook endpoint and returns the signing secret used to verify delivered events.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'url', type: 'string', required: true, location: 'body', description: 'HTTPS webhook destination. localhost is allowed for testing.' },
        { name: 'events', type: 'array', location: 'body', description: 'Array of subscribed event names. Use ["*"] to receive all events.' },
        { name: 'description', type: 'string', location: 'body', description: 'Optional internal label for the endpoint.' },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/webhooks' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "url": "https://merchant.example.com/webhooks/flapapay",
    "events": ["collection.successful", "collection.settled", "transfer.successful"],
    "description": "Production listener"
  }'`,
      responseExample: `{
  "id": "wh_123",
  "url": "https://merchant.example.com/webhooks/flapapay",
  "events": ["collection.successful", "collection.settled", "transfer.successful"],
  "description": "Production listener",
  "created_at": "2026-07-30T12:00:00.000Z",
  "signing_secret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}`,
    },
  },
  {
    slug: 'delete-webhook-endpoint',
    title: 'Delete Webhook Endpoint',
    summary: 'Remove a registered webhook destination.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Delete a webhook endpoint when it should no longer receive events.',
    ],
    endpoint: {
      method: 'DELETE',
      path: '/v1/webhooks/:id',
      summary: 'Delete webhook endpoint',
      description: 'Deletes a registered webhook endpoint owned by the authenticated merchant.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'id', type: 'string', required: true, location: 'path', description: 'Webhook endpoint identifier.' },
      ],
      requestExample: `curl --request DELETE '${PUBLIC_API_BASE}/v1/webhooks/wh_123' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "deleted": true
}`,
    },
  },
  {
    slug: 'receive-webhook-events',
    title: 'Receive Webhook Events',
    summary: 'Expose an unauthenticated POST route to accept FlapaPay events.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Your server should expose a public POST route that accepts JSON bodies sent by FlapaPay.',
      'Always acknowledge the request quickly and perform downstream work asynchronously if your processing can take more than a few seconds.',
    ],
    bullets: [
      'Webhook routes should be public and unauthenticated',
      'Read the raw request body before signature verification',
      'Respond with 200, 201, or 202 to acknowledge delivery',
    ],
    exampleTitle: 'Node example',
    exampleLanguage: 'javascript',
    exampleCode: `import express from 'express';

const app = express();

app.post('/webhooks/flapapay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-flapapay-signature'];
  const rawBody = req.body.toString('utf8');

  // Verify signature first, then parse and process
  const event = JSON.parse(rawBody);
  console.log(event.event, event.id);

  res.status(200).send('ok');
});`,
  },
  {
    slug: 'verify-webhook-signatures',
    title: 'Verify Webhook Signatures',
    summary: 'Validate that webhook events were sent by FlapaPay.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'FlapaPay signs each delivered webhook with the x-flapapay-signature header using HMAC-SHA256.',
      'The header format is t={timestamp},v1={signature}. Recompute the signature using the signed payload string {timestamp}.{rawBody} and compare it with the received v1 value.',
    ],
    bullets: [
      'Use the signing secret returned when the endpoint was created',
      'Verify the raw body, not a reserialized object',
      'Reject events that fail signature validation',
    ],
    exampleTitle: 'Signature verification',
    exampleLanguage: 'javascript',
    exampleCode: `import crypto from 'crypto';

function verifyFlapaPaySignature(rawBody, signatureHeader, signingSecret) {
  const parts = Object.fromEntries(
    String(signatureHeader || '')
      .split(',')
      .map((segment) => segment.split('='))
      .filter(([key, value]) => key && value)
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) return false;

  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const expected = crypto.createHmac('sha256', signingSecret).update(signedPayload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`,
  },
  {
    slug: 'respond-to-webhooks',
    title: 'Respond To Webhooks',
    summary: 'Acknowledge events quickly and avoid duplicate fulfillment.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'Respond with a 2xx status code as soon as you have accepted the event for processing.',
      'If your endpoint returns a non-2xx status or times out, FlapaPay will record the failure and the delivery can be retried.',
    ],
    bullets: [
      'Return 200, 201, or 202 after verification',
      'Store event IDs to make your processing idempotent',
      'Queue heavy work instead of blocking the HTTP response',
    ],
  },
  {
    slug: 'list-webhook-deliveries',
    title: 'List Webhook Deliveries',
    summary: 'Inspect delivery logs across all webhook endpoints.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Use the webhook deliveries API to inspect recent successes and failures by event type, endpoint, or status.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/webhooks/deliveries',
      summary: 'List webhook deliveries',
      description: 'Returns delivery log entries across the merchant webhook endpoints with optional filtering.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'event_type', type: 'string', location: 'query', description: 'Optional event name filter.' },
        { name: 'status', type: 'string', location: 'query', description: 'Optional delivery status filter: success or failed.' },
        { name: 'endpoint_id', type: 'string', location: 'query', description: 'Optional webhook endpoint identifier.' },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/webhooks/deliveries?status=failed' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "deliveries": [
    {
      "id": "wd_123",
      "event": "collection.successful",
      "response_status": 500,
      "endpoint_url": "https://merchant.example.com/webhooks/flapapay",
      "delivered_at": "2026-07-30T12:30:00.000Z"
    }
  ],
  "total": 1
}`,
    },
  },
  {
    slug: 'list-webhook-endpoint-events',
    title: 'List Endpoint Events',
    summary: 'Fetch recent deliveries for one webhook endpoint.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Fetch the recent webhook deliveries for a single endpoint to debug one integration target.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/webhooks/:id/events',
      summary: 'List endpoint events',
      description: 'Returns recent delivery attempts for a single webhook endpoint.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'id', type: 'string', required: true, location: 'path', description: 'Webhook endpoint identifier.' },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/webhooks/wh_123/events' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `[
  {
    "id": "wd_123",
    "event": "collection.successful",
    "response_status": 200,
    "delivered_at": "2026-07-30T12:30:00.000Z"
  }
]`,
    },
  },
  {
    slug: 'test-webhooks',
    title: 'Test Webhooks',
    summary: 'Send a test event to a registered webhook endpoint.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Use the test delivery endpoint to send a sandbox event to one of your registered webhook URLs.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/webhooks/:id/test',
      summary: 'Test webhook delivery',
      description: 'Test-fires a webhook delivery for a specified endpoint with either a standard event name or a custom payload.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'id', type: 'string', required: true, location: 'path', description: 'Webhook endpoint identifier.' },
        { name: 'event_type', type: 'string', location: 'body', description: 'Optional event name to simulate.' },
        { name: 'custom_payload', type: 'object', location: 'body', description: 'Optional custom data payload.' },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/webhooks/wh_123/test' \\
  --header 'Authorization: Bearer flp_live_sk_xxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "event_type": "collection.successful"
  }'`,
      responseExample: `{
  "success": true,
  "response_status": 200,
  "delivery_id": "wd_123",
  "event_type": "collection.successful"
}`,
    },
  },
  {
    slug: 'retry-webhook-delivery',
    title: 'Retry Webhook Delivery',
    summary: 'Retry a failed webhook delivery from the delivery log.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'Retry a failed delivery after fixing the receiving server or investigating the payload handling issue.',
    ],
    endpoint: {
      method: 'POST',
      path: '/v1/webhooks/deliveries/:id/retry',
      summary: 'Retry webhook delivery',
      description: 'Replays a failed delivery using the same event payload and a fresh FlapaPay signature.',
      auth: 'Bearer merchant secret key',
      params: [
        { name: 'id', type: 'string', required: true, location: 'path', description: 'Webhook delivery identifier.' },
      ],
      requestExample: `curl --request POST '${PUBLIC_API_BASE}/v1/webhooks/deliveries/wd_123/retry' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "delivery_id": "wd_124",
  "response_status": 200,
  "success": true
}`,
    },
  },
  {
    slug: 'webhook-event-types',
    title: 'Webhook Event Types',
    summary: 'Understand the event names FlapaPay can deliver to your server.',
    group: 'Webhooks',
    parentSlug: 'webhooks',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'FlapaPay emits events for collections, transfers, payouts, settlements, and wallet activity.',
      'The exact payload depends on the event family, but all events share a top-level envelope with an event name, creation timestamp, and structured data object.',
    ],
    bullets: [
      'collection.successful',
      'collection.failed',
      'collection.settled',
      'transfer.successful',
      'transfer.failed',
      'transaction.credit',
      'transaction.debit',
    ],
    exampleTitle: 'Webhook event envelope',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_123",
  "event": "collection.successful",
  "livemode": false,
  "created": 1785412800,
  "data": {
    "reference": "ref-1",
    "amount": "13.00",
    "currency": "ZMW"
  }
}`,
  },
  {
    slug: 'event-transfer-successful',
    title: 'transfer.successful',
    summary: 'Delivered when a merchant transfer completes successfully.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Use this event to update payout state in your system after a bank or mobile money transfer completes.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_transfer_success",
  "event": "transfer.successful",
  "created": 1785412800,
  "data": {
    "id": "tr_123",
    "reference": "bank-001",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "status": "successful",
    "completedAt": "2026-07-30T12:00:00.000Z"
  }
}`,
  },
  {
    slug: 'event-transfer-failed',
    title: 'transfer.failed',
    summary: 'Delivered when a merchant transfer fails.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'Use this event to reverse pending payout state and notify operations when a transfer fails.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_transfer_failed",
  "event": "transfer.failed",
  "created": 1785412800,
  "data": {
    "id": "tr_124",
    "reference": "mm-001",
    "amount": "50.00",
    "currency": "ZMW",
    "status": "failed",
    "reasonForFailure": "recipient_unavailable"
  }
}`,
  },
  {
    slug: 'event-collection-successful',
    title: 'collection.successful',
    summary: 'Delivered when a collection completes successfully.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <CreditCard className="h-4 w-4" />,
    intro: [
      'Use this event to confirm payment success before issuing value to the customer.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_collection_success",
  "event": "collection.successful",
  "created": 1785412800,
  "data": {
    "reference": "card-001",
    "type": "card",
    "amount": "50000.00",
    "currency": "ZMW",
    "status": "successful",
    "settlementStatus": "pending"
  }
}`,
  },
  {
    slug: 'event-collection-failed',
    title: 'collection.failed',
    summary: 'Delivered when a collection attempt fails.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <CreditCard className="h-4 w-4" />,
    intro: [
      'Use this event to stop fulfillment and surface the failure reason to internal systems.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_collection_failed",
  "event": "collection.failed",
  "created": 1785412800,
  "data": {
    "reference": "ref-2",
    "type": "mobile-money",
    "amount": "13.00",
    "currency": "ZMW",
    "status": "failed",
    "reasonForFailure": "authorization_timeout"
  }
}`,
  },
  {
    slug: 'event-collection-settled',
    title: 'collection.settled',
    summary: 'Delivered when funds settle into the merchant wallet.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <Wallet className="h-4 w-4" />,
    intro: [
      'Use this event to reconcile merchant wallet balances and external reporting systems.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_collection_settled",
  "event": "collection.settled",
  "created": 1785412800,
  "data": {
    "reference": "card-001",
    "amount": "50000.00",
    "currency": "ZMW",
    "settlementStatus": "settled",
    "settledAt": "2026-07-30T12:15:00.000Z"
  }
}`,
  },
  {
    slug: 'event-transaction-credit',
    title: 'transaction.credit',
    summary: 'Delivered when the merchant wallet receives a credit.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <Wallet className="h-4 w-4" />,
    intro: [
      'This event helps external systems mirror incoming ledger movements and wallet balance changes.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_transaction_credit",
  "event": "transaction.credit",
  "created": 1785412800,
  "data": {
    "id": "txn_123",
    "amount": "50000.00",
    "currency": "ZMW",
    "narration": "Collection settlement",
    "type": "credit",
    "balance": "250000.00"
  }
}`,
  },
  {
    slug: 'event-transaction-debit',
    title: 'transaction.debit',
    summary: 'Delivered when the merchant wallet is debited.',
    group: 'Webhooks',
    parentSlug: 'webhook-event-types',
    icon: <Wallet className="h-4 w-4" />,
    intro: [
      'This event helps external systems track debits such as disbursements, fees, or reversals.',
    ],
    exampleTitle: 'Event payload',
    exampleLanguage: 'json',
    exampleCode: `{
  "id": "evt_transaction_debit",
  "event": "transaction.debit",
  "created": 1785412800,
  "data": {
    "id": "txn_124",
    "amount": "20.00",
    "currency": "ZMW",
    "narration": "Bank disbursement",
    "type": "debit",
    "balance": "249980.00"
  }
}`,
  },
  {
    slug: 'encryption',
    title: 'Encryption',
    summary: 'Understand how FlapaPay protects transport and sensitive payloads.',
    group: 'Encryption',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'FlapaPay secures API traffic with TLS in transit and uses stronger payload-level protection for encryption-enabled sensitive flows.',
      'For endpoints that require encrypted payloads, FlapaPay uses a JWE-style model with RSA key wrapping and AES content encryption so sensitive values never travel as plain JSON.',
    ],
    bullets: [
      'Transport security is always provided by HTTPS',
      'Payload encryption is reserved for sensitive endpoint families',
      'Encryption-enabled flows should use short-lived public keys and compact JWE payloads',
    ],
  },
  {
    slug: 'get-encryption-key',
    title: 'Get Encryption Key',
    summary: 'Fetch the active public JWK for FlapaPay encryption-enabled requests.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Fetch the current FlapaPay public encryption key immediately before encrypting a sensitive payload.',
      'The key response includes the JWK fields and the kid value you should place in the protected JWE header.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/encryption-key',
      summary: 'Get encryption key',
      description: 'Returns the current FlapaPay public JWK and metadata for encryption-enabled request flows.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/encryption-key' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Encryption key fetched successfully",
  "data": {
    "kty": "RSA",
    "use": "enc",
    "alg": "RSA-OAEP-256",
    "n": "nApb8LyyFrZw4A...W1RpGR6Z7zcNikiZcQ",
    "e": "AQAB",
    "kid": "enc_20260730124500_ab12cd34",
    "issuedAt": "2026-07-30T12:45:00.000Z",
    "expiresAt": "2026-07-30T13:45:00.000Z",
    "format": "jwk",
    "transport": "jwe-compact",
    "supportedAlgorithms": {
      "keyEncryption": "RSA-OAEP-256",
      "contentEncryption": "A256GCM"
    }
  }
}`,
    },
  },
  {
    slug: 'transport-security',
    title: 'Transport Security',
    summary: 'All FlapaPay API traffic is encrypted in transit by default.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Every FlapaPay merchant API request must be sent over HTTPS, which encrypts traffic in transit with TLS.',
      'This protects API keys, tokens, webhook secrets, and transaction metadata from interception across the network.',
    ],
    bullets: [
      'Always call https://api.flapapay.com',
      'Never transmit API keys over plain HTTP',
      'Terminate TLS only on infrastructure you trust',
    ],
  },
  {
    slug: 'payload-encryption',
    title: 'Payload Encryption',
    summary: 'Encrypt sensitive request bodies for encryption-enabled flows.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'For flows that require payload-level protection, encrypt the original JSON into JWE compact serialization before sending it to FlapaPay.',
      'The encryption model uses RSA-OAEP-256 for key encryption and A256GCM for content encryption.',
    ],
    bullets: [
      'Encrypt the raw JSON payload, not form-encoded data',
      'Fetch the current key from GET /v1/encryption-key before encrypting',
      'Use a short-lived public key identified by kid',
      'Send the encrypted payload in place of the original sensitive object',
    ],
    exampleTitle: 'Protected JWE headers',
    exampleLanguage: 'json',
    exampleCode: `{
  "alg": "RSA-OAEP-256",
  "enc": "A256GCM",
  "cty": "application/json",
  "kid": "enc_key_20260730"
}`,
  },
  {
    slug: 'encrypted-request-body',
    title: 'Encrypted Request Body',
    summary: 'Wrap encrypted sensitive data in a FlapaPay request payload.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'When an endpoint requires encrypted data, replace the plain sensitive object with an encryptedPayload field that contains the compact serialized JWE string.',
    ],
    exampleTitle: 'Request body structure',
    exampleLanguage: 'json',
    exampleCode: `{
  "encryptedPayload": "eyJraWQiOiJlbmNfa2V5XzIwMjYwNzMwIiwiYWxnIjoiUlNBLU9BRVAtMjU2IiwiZW5jIjoiQTI1NkdDTSIsImN0eSI6ImFwcGxpY2F0aW9uL2pzb24ifQ..."
}`,
  },
  {
    slug: 'node-encryption-example',
    title: 'Node Encryption Example',
    summary: 'Example JWE encryption flow for FlapaPay integrations in Node.js.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <Send className="h-4 w-4" />,
    intro: [
      'This example shows how a merchant application can encrypt a sensitive JSON payload before sending it to a FlapaPay encryption-enabled endpoint.',
    ],
    exampleTitle: 'Node.js example',
    exampleLanguage: 'javascript',
    exampleCode: `import * as jose from 'jose';

async function encryptPayload(payload, jwkData) {
  const rsaPublicKey = await jose.importJWK(jwkData, 'RSA-OAEP-256');
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));

  return await new jose.CompactEncrypt(plaintext)
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      cty: 'application/json',
      kid: jwkData.kid,
    })
    .encrypt(rsaPublicKey);
}`,
  },
  {
    slug: 'encryption-roadmap',
    title: 'Encryption Key Rotation',
    summary: 'Understand key lifetime and how to safely handle FlapaPay encryption keys.',
    group: 'Encryption',
    parentSlug: 'encryption',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'FlapaPay encryption keys are designed to be short-lived so merchants can fetch current JWK material dynamically before encrypting sensitive payloads.',
      'Do not persist old keys indefinitely. Fetch a fresh key when you start a new sensitive request flow or when a previously fetched key has expired.',
    ],
    bullets: [
      'Endpoint: GET /v1/encryption-key',
      'Use the returned kid in your JWE protected header',
      'Treat expiresAt as the boundary for safe client-side reuse',
    ],
  },
  {
    slug: 'settlements',
    title: 'Settlements',
    summary: 'Inspect normalized wallet-backed settlement records.',
    group: 'Reporting',
    icon: <RefreshCw className="h-4 w-4" />,
    intro: [
      'Settlements expose the FlapaPay view of funds movement across collections and disbursements.',
      'These records are derived from wallet and ledger state rather than provider-specific reporting.',
    ],
  },
  {
    slug: 'list-settlements',
    title: 'List Settlements',
    summary: 'Retrieve merchant settlement records.',
    group: 'Reporting',
    parentSlug: 'settlements',
    icon: <List className="h-4 w-4" />,
    intro: [
      'Returns the merchant settlement stream in a normalized FlapaPay format.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/settlements',
      summary: 'List settlements',
      description: 'Returns settlement records across collections and transfers.',
      auth: 'Bearer merchant secret key',
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/settlements' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Settlements fetched successfully",
  "data": [
    {
      "reference": "card-001",
      "type": "collection",
      "status": "settled",
      "amount": "50000.00",
      "currency": "ZMW"
    }
  ]
}`,
    },
  },
  {
    slug: 'get-settlement',
    title: 'Get Settlement',
    summary: 'Retrieve one settlement record by reference.',
    group: 'Reporting',
    parentSlug: 'settlements',
    icon: <Database className="h-4 w-4" />,
    intro: [
      'Use this endpoint to inspect the settlement state for one transaction reference.',
    ],
    endpoint: {
      method: 'GET',
      path: '/v1/settlements/:reference',
      summary: 'Get settlement',
      description: 'Returns one normalized settlement record by reference.',
      auth: 'Bearer merchant secret key',
      params: [
        {
          name: 'reference',
          type: 'string',
          required: true,
          location: 'path',
          description: 'Settlement reference.',
        },
      ],
      requestExample: `curl --request GET '${PUBLIC_API_BASE}/v1/settlements/card-001' \\
  --header 'Authorization: Bearer flp_live_sk_xxx'`,
      responseExample: `{
  "status": true,
  "message": "Settlement fetched successfully",
  "data": {
    "reference": "card-001",
    "type": "collection",
    "status": "settled",
    "amount": "50000.00",
    "currency": "ZMW"
  }
}`,
    },
  },
];

const groupOrder: DocPage['group'][] = [
  'Getting Started',
  'Accounts & Banks',
  'Collections',
  'Hosted Checkout',
  'Disbursements',
  'Webhooks',
  'Encryption',
  'Reporting',
];

const endpointPages = pages.filter((page) => page.endpoint);

const extractJsonBody = (requestExample?: string) => {
  if (!requestExample) return null;
  const match = requestExample.match(/--data '([\s\S]*)'$/);
  return match ? match[1] : null;
};

const indentBlock = (value: string, spaces = 2) =>
  value
    .split('\n')
    .map((line) => `${' '.repeat(spaces)}${line}`)
    .join('\n');

const buildRequestSnippet = (endpoint: DocEndpoint, language: CodeLanguage) => {
  const body = extractJsonBody(endpoint.requestExample);
  const hasBody = Boolean(body);
  const url = `${PUBLIC_API_BASE}${endpoint.path.replace(':id', 'cs_test_123').replace(':reference', 'ref_123')}`;

  switch (language) {
    case 'curl':
      return endpoint.requestExample || '';
    case 'node':
      return `const response = await fetch('${url}', {
  method: '${endpoint.method}',
  headers: {
    Authorization: 'Bearer ${DEFAULT_API_KEY}',${hasBody ? `
    'Content-Type': '${DEFAULT_CONTENT_TYPE}',` : ''}
  },${hasBody ? `
  body: JSON.stringify(${body}),` : ''}
});

const data = await response.json();
console.log(data);`;
    case 'python':
      return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${DEFAULT_API_KEY}",${hasBody ? `
    "Content-Type": "${DEFAULT_CONTENT_TYPE}",` : ''}
}
${hasBody ? `payload = ${body}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=payload)` : `response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}
data = response.json()
print(data)`;
    case 'php':
      return `<?php
$url = '${url}';
$headers = [
    'Authorization: Bearer ${DEFAULT_API_KEY}',${hasBody ? `
    'Content-Type: ${DEFAULT_CONTENT_TYPE}',` : ''}
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${endpoint.method}');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);${hasBody ? `
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${body}));` : ''}

$response = curl_exec($ch);
curl_close($ch);

echo $response;`;
    case 'ruby':
      return `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse('${url}')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
request = Net::HTTP::${endpoint.method === 'DELETE' ? 'Delete' : endpoint.method === 'POST' ? 'Post' : 'Get'}.new(uri.request_uri)
request['Authorization'] = 'Bearer ${DEFAULT_API_KEY}'${hasBody ? `
request['Content-Type'] = '${DEFAULT_CONTENT_TYPE}'
request.body = JSON.generate(${body})` : ''}

response = http.request(request)
puts response.body`;
    case 'shell':
      return `${endpoint.requestExample || ''}${hasBody ? `\n\n# Pipe to jq if you want formatted output\n# ... | jq` : '\n\n# Inspect the raw JSON response in your shell.'}`;
    case 'java':
      return `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .header("Authorization", "Bearer ${DEFAULT_API_KEY}")${hasBody ? `
    .header("Content-Type", "${DEFAULT_CONTENT_TYPE}")` : ''}
    .method("${endpoint.method}", ${hasBody ? `HttpRequest.BodyPublishers.ofString("""
${body}
""")` : 'HttpRequest.BodyPublishers.noBody()'})
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`;
    default:
      return endpoint.requestExample || '';
  }
};

const buildResponseSnippet = (endpoint: DocEndpoint, language: CodeLanguage) => {
  const response = endpoint.responseExample || '{}';

  switch (language) {
    case 'curl':
      return response;
    case 'node':
      return `const data = ${response};
console.log(data);`;
    case 'python':
      return `data = ${response}
print(data)`;
    case 'php':
      return `<?php
$response = <<<'JSON'
${response}
JSON;

$data = json_decode($response, true);
print_r($data);`;
    case 'ruby':
      return `require 'json'

response = <<~JSON
${indentBlock(response, 0)}
JSON

data = JSON.parse(response)
puts data`;
    case 'shell':
      return `cat <<'JSON'
${response}
JSON`;
    case 'java':
      return `String response = """
${response}
""";

System.out.println(response);`;
    default:
      return response;
  }
};

const buildMarkdownDocument = (page: DocPage) => {
  const lines: string[] = [
    `# ${page.title}`,
    '',
    page.summary,
    '',
    ...page.intro,
  ];

  if (page.bullets?.length) {
    lines.push('', '## Highlights', '');
    page.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
  }

  if (page.exampleCode) {
    lines.push(
      '',
      `## ${page.exampleTitle || 'Example'}`,
      '',
      `\`\`\`${page.exampleLanguage || 'text'}`,
      page.exampleCode,
      '```',
    );
  }

  if (page.endpoint) {
    lines.push(
      '',
      '## Endpoint',
      '',
      `- Method: \`${page.endpoint.method}\``,
      `- Path: \`${page.endpoint.path}\``,
    );

    if (page.endpoint.auth) {
      lines.push(`- Authentication: ${page.endpoint.auth}`);
    }

    lines.push('', page.endpoint.description);

    if (page.endpoint.params?.length) {
      lines.push('', '## Parameters', '');
      page.endpoint.params.forEach((param) => {
        lines.push(`- \`${param.name}\` (${param.type}${param.required ? ', required' : ''}${param.location ? `, ${param.location}` : ''})`);
        lines.push(`  ${param.description}`);
      });
    }

    if (page.endpoint.requestExample) {
      lines.push('', '## Request', '', '```bash', page.endpoint.requestExample, '```');
    }

    if (page.endpoint.responseExample) {
      lines.push('', '## Response', '', '```json', page.endpoint.responseExample, '```');
    }
  }

  return lines.join('\n');
};

const copyText = async (value: string, setCopied: (key: string | null) => void, key: string) => {
  await navigator.clipboard.writeText(value);
  setCopied(key);
  window.setTimeout(() => setCopied(null), 1800);
};

const EndpointPanel: React.FC<{
  endpoint: DocEndpoint;
  copiedKey: string | null;
  setCopiedKey: (key: string | null) => void;
  activeLanguage: CodeLanguage;
  setActiveLanguage: (language: CodeLanguage) => void;
}> = ({
  endpoint,
  copiedKey,
  setCopiedKey,
  activeLanguage,
  setActiveLanguage,
}) => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] ${methodClassMap[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-white/90">{endpoint.path}</code>
      </div>
      <p className="text-sm text-white/68">{endpoint.description}</p>
      {endpoint.auth && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
          Authentication: {endpoint.auth}
        </div>
      )}
    </div>

    {endpoint.params && endpoint.params.length > 0 && (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Parameters</h3>
        <div className="space-y-3">
          {endpoint.params.map((param) => (
            <div key={`${endpoint.path}-${param.name}`} className="rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-sm font-semibold text-white">{param.name}</code>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.24em] text-white/55">
                  {param.location || 'body'}
                </span>
                <span className="text-xs text-amber-200">{param.type}</span>
                {param.required && <span className="text-xs text-rose-200">required</span>}
              </div>
              <p className="mt-2 text-sm text-white/68">{param.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {endpoint.requestExample && (
      <div className="rounded-3xl border border-white/10 bg-[#060606]">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">Request</h3>
            <button
              type="button"
              onClick={() => copyText(buildRequestSnippet(endpoint, activeLanguage), setCopiedKey, `${endpoint.path}-request`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#f4b53f]/60 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === `${endpoint.path}-request` ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(languageLabels).map(([key, label]) => {
              const language = key as CodeLanguage;
              return (
                <button
                  key={`${endpoint.path}-request-${language}`}
                  type="button"
                  onClick={() => setActiveLanguage(language)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeLanguage === language
                      ? 'bg-[#f4b53f] text-black'
                      : 'border border-white/10 text-white/65 hover:border-[#f4b53f]/40 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <pre className="overflow-x-auto px-5 py-5 text-sm leading-7 text-[#f6d27a]">
          <code>{buildRequestSnippet(endpoint, activeLanguage)}</code>
        </pre>
      </div>
    )}

    {endpoint.responseExample && (
      <div className="rounded-3xl border border-white/10 bg-[#060606]">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">Response</h3>
            <button
              type="button"
              onClick={() => copyText(buildResponseSnippet(endpoint, activeLanguage), setCopiedKey, `${endpoint.path}-response`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#f4b53f]/60 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === `${endpoint.path}-response` ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(languageLabels).map(([key, label]) => {
              const language = key as CodeLanguage;
              return (
                <button
                  key={`${endpoint.path}-response-${language}`}
                  type="button"
                  onClick={() => setActiveLanguage(language)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeLanguage === language
                      ? 'bg-[#f4b53f] text-black'
                      : 'border border-white/10 text-white/65 hover:border-[#f4b53f]/40 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <pre className="overflow-x-auto px-5 py-5 text-sm leading-7 text-[#b8f7d4]">
          <code>{buildResponseSnippet(endpoint, activeLanguage)}</code>
        </pre>
      </div>
    )}
  </div>
);

export const DocumentationHubPage: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('curl');
  const [showMarkdown, setShowMarkdown] = useState(false);

  const pageMap = useMemo(() => new Map(pages.map((page) => [page.slug, page])), []);
  const selectedPage = section ? pageMap.get(section) : pageMap.get('introduction');

  const topLevelPages = useMemo(
    () => pages.filter((page) => !page.parentSlug),
    [],
  );

  const childPageMap = useMemo(() => {
    const map = new Map<string, DocPage[]>();
    pages
      .filter((page) => page.parentSlug)
      .forEach((page) => {
        const existing = map.get(page.parentSlug!) || [];
        existing.push(page);
        map.set(page.parentSlug!, existing);
      });
    return map;
  }, []);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    topLevelPages.forEach((page) => {
      initial[page.slug] = true;
    });
    return initial;
  });

  if (!selectedPage) {
    return <Navigate to="/documentation/introduction" replace />;
  }

  const markdownDocument = buildMarkdownDocument(selectedPage);
  const openMarkdownInChat = async (provider: 'chatgpt' | 'claude') => {
    const prompt = `Use this FlapaPay API markdown reference in the chat:\n\n${markdownDocument}`;
    await copyText(markdownDocument, setCopiedKey, `${selectedPage.slug}-markdown`);
    if (provider === 'chatgpt') {
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(`https://claude.ai/new?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener,noreferrer');
  };

  const groupedTopLevel = groupOrder.map((group) => ({
    group,
    items: topLevelPages.filter((page) => page.group === group),
  })).filter((sectionGroup) => sectionGroup.items.length > 0);

  const relatedEndpoints = childPageMap.get(selectedPage.slug) || [];
  const siblingEndpoints = selectedPage.parentSlug ? childPageMap.get(selectedPage.parentSlug) || [] : [];
  const renderNavItem = (item: DocPage, depth = 0): React.ReactNode => {
    const children = childPageMap.get(item.slug) || [];
    const isOpen = expanded[item.slug] ?? true;
    const isActive = selectedPage.slug === item.slug;

    return (
      <div key={item.slug} className="rounded-2xl">
        <div className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 ${isActive ? 'bg-[#f4b53f]/12' : ''}`}>
          <Link
            to={`/documentation/${item.slug}`}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-sm transition ${
              isActive ? 'text-white' : 'text-white/68 hover:bg-white/6 hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <span className="text-[#f4b53f]">{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </Link>
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => ({ ...prev, [item.slug]: !isOpen }))}
              className="rounded-lg p-1 text-white/52 transition hover:bg-white/6 hover:text-white"
              aria-label={isOpen ? `Collapse ${item.title}` : `Expand ${item.title}`}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        {children.length > 0 && isOpen && (
          <div className={`${depth === 0 ? 'ml-5' : 'ml-7'} border-l border-white/10 pl-1`}>
            {children.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}>
      <Navbar />
      <section className="border-b border-white/10 bg-black bg-[radial-gradient(circle_at_top_left,rgba(255,166,43,0.34),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,210,74,0.2),transparent_48%)]">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.34em] text-[#f4b53f]">FlapaPay API</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Welcome to FlapaPay&apos;s API doc.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/72">
              Explore the FlapaPay API for banks, account resolution, collections, disbursements, recipients, settlements, and hosted checkout flows. These docs are designed to help merchants integrate faster with clear endpoint references, request examples, and wallet-backed transaction behavior.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Base URL</div>
              <div className="mt-2 text-sm text-white/82">{PUBLIC_API_BASE}</div>
            </div>

            <nav className="space-y-6">
              {groupedTopLevel.map(({ group, items }) => (
                <div key={group}>
                  <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/38">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => renderNavItem(item))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_26px_80px_rgba(0,0,0,0.3)] sm:p-8">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f4b53f]/30 bg-[#f4b53f]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#ffd780]">
                  {selectedPage.group}
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{selectedPage.title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/70">{selectedPage.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(markdownDocument, setCopiedKey, `${selectedPage.slug}-markdown`)}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-[#f4b53f]/45 hover:text-white"
                >
                  {copiedKey === `${selectedPage.slug}-markdown` ? 'Markdown Copied' : 'Copy Markdown'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarkdown((value) => !value)}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-[#f4b53f]/45 hover:text-white"
                >
                  {showMarkdown ? 'Hide Markdown' : 'View In Markdown'}
                </button>
                <button
                  type="button"
                  onClick={() => openMarkdownInChat('chatgpt')}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-[#f4b53f]/45 hover:text-white"
                >
                  Open In ChatGPT
                </button>
                <button
                  type="button"
                  onClick={() => openMarkdownInChat('claude')}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/72 transition hover:border-[#f4b53f]/45 hover:text-white"
                >
                  Open In Claude
                </button>
              </div>
            </div>

            {showMarkdown && (
              <div className="mb-8 rounded-3xl border border-white/10 bg-[#060606]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">Markdown</h3>
                  <button
                    type="button"
                    onClick={() => copyText(markdownDocument, setCopiedKey, `${selectedPage.slug}-markdown-panel`)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#f4b53f]/60 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedKey === `${selectedPage.slug}-markdown-panel` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="overflow-x-auto px-5 py-5 text-sm leading-7 text-[#f6d27a]">
                  <code>{markdownDocument}</code>
                </pre>
              </div>
            )}

            <div className="space-y-4">
              {selectedPage.intro.map((paragraph, index) => (
                <p key={`${selectedPage.slug}-intro-${index}`} className="text-[15px] leading-8 text-white/74">
                  {paragraph}
                </p>
              ))}
            </div>

            {selectedPage.bullets && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Highlights</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedPage.bullets.map((bullet) => (
                    <div key={bullet} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/74">
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPage.exampleCode && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-[#060606]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
                    {selectedPage.exampleTitle || 'Example'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyText(selectedPage.exampleCode!, setCopiedKey, `${selectedPage.slug}-example`)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#f4b53f]/60 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedKey === `${selectedPage.slug}-example` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="overflow-x-auto px-5 py-5 text-sm leading-7 text-[#f6d27a]">
                  <code>{selectedPage.exampleCode}</code>
                </pre>
              </div>
            )}

            {selectedPage.endpoint ? (
              <div className="mt-10">
                <EndpointPanel
                  endpoint={selectedPage.endpoint}
                  copiedKey={copiedKey}
                  setCopiedKey={setCopiedKey}
                  activeLanguage={activeLanguage}
                  setActiveLanguage={setActiveLanguage}
                />
              </div>
            ) : relatedEndpoints.length > 0 ? (
              <div className="mt-10">
                <h3 className="mb-5 text-lg font-semibold text-white">Endpoints in this section</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {relatedEndpoints.map((page) => (
                    <Link
                      key={page.slug}
                      to={`/documentation/${page.slug}`}
                      className="group rounded-3xl border border-white/10 bg-black/25 p-5 transition hover:border-[#f4b53f]/35 hover:bg-black/35"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[#f4b53f]">{page.icon}</span>
                          <div className="text-base font-semibold text-white">{page.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40 transition group-hover:text-[#f4b53f]" />
                      </div>
                      <p className="text-sm leading-7 text-white/68">{page.summary}</p>
                      {page.endpoint && (
                        <div className="mt-4 flex items-center gap-3 text-xs">
                          <span className={`rounded-full px-2.5 py-1 font-semibold tracking-[0.24em] ${methodClassMap[page.endpoint.method]}`}>
                            {page.endpoint.method}
                          </span>
                          <code className="text-white/58">{page.endpoint.path}</code>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {!selectedPage.endpoint && selectedPage.slug === 'introduction' && (
              <div className="mt-10 grid gap-4 lg:grid-cols-2">
                {groupOrder
                  .filter((group) => group !== 'Getting Started')
                  .map((group) => {
                    const groupPages = topLevelPages.filter((page) => page.group === group);
                    return groupPages.map((page) => (
                      <Link
                        key={page.slug}
                        to={`/documentation/${page.slug}`}
                        className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-[#f4b53f]/35 hover:bg-black/35"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <span className="text-[#f4b53f]">{page.icon}</span>
                          <div className="text-base font-semibold text-white">{page.title}</div>
                        </div>
                        <p className="text-sm leading-7 text-white/68">{page.summary}</p>
                      </Link>
                    ));
                  })}
              </div>
            )}

            {selectedPage.endpoint && siblingEndpoints.length > 1 && (
              <div className="mt-12 rounded-3xl border border-white/10 bg-black/20 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Related endpoints</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {siblingEndpoints
                    .filter((page) => page.slug !== selectedPage.slug)
                    .map((page) => (
                      <Link
                        key={page.slug}
                        to={`/documentation/${page.slug}`}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72 transition hover:border-[#f4b53f]/35 hover:text-white"
                      >
                        {page.title}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">Reference map</h3>
            <p className="mt-2 text-sm leading-7 text-white/68">
              The current FlapaPay reference includes {endpointPages.length} endpoint pages across banks, resolve, recipients, collections, disbursements, and settlements.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
