import { parseCurlCommands } from './src/lib/curl-parser';

const str = `curl --location 'https://kubeingress.mp05.eng.sjc01.qualys.com/mssp/fo/dashboard/widget/data/multi' \\
--header 'Content-Type: application/json' \\
--header 'Cookie: QualysSession=TGT189-syQVZgSdfhqrucylyoMdCVcfwnSjXMjGyfRxWBKXJsjlkXSHDumQcqyleWkmgKEO-qas-6d574574f8-52c6n' \\
--data '{
    "subscriptionInfoIds": [
        18089338
    ],
    "query": {
        "Malware_query": {
            "basePath": "data.count",
            "responseType": "count",
            "method": "POST",
            "uri": "/etm/v3/findings/count",
            "body": "{\n  \"query\": \"finding.severity > 3\",\n  \"module\": \"ETM\",\n  \"nestedAttribute\": \"etmFindings\"\n}"
        }
    }
}'`;

// exact logic from CurlImportDialog
const normalized = str.replace(/\\[\r\n]+\s*/g, ' ');
const commands = normalized
  .split(/(?=curl\s+)/)
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.toLowerCase().startsWith('curl'));

const parsed = parseCurlCommands(commands);
console.log(JSON.stringify(parsed, null, 2));
