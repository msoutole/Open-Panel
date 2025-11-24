// Temporarily disabled due to module import issues
// import { NodeSDK } from '@opentelemetry/sdk-node';
// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
// import { Resource } from '@opentelemetry/resources';
// import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// const sdk = new NodeSDK({
//   resource: new Resource({
//     [ATTR_SERVICE_NAME]: 'openpanel-api',
//   }),
//   traceExporter: new OTLPTraceExporter({
//     // AI Toolkit supports http/protobuf at port 4318
//     url: 'http://localhost:4318/v1/traces',
//   }),
//   instrumentations: [getNodeAutoInstrumentations()],
// });

// sdk.start();

