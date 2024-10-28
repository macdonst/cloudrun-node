const {FunctionServiceClient} = require('@google-cloud/functions').v2;
const {Storage} = require('@google-cloud/storage');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const projectId = 'google-project-id'; // Replace with your GCP project ID
const location = 'country-location'; // Location for the function
const bucketName = `${Math.random().toString(36).substring(2, 15)}-gcf-source`;
const functionName = 'function-v2';
const functionSourceDir = path.join(__dirname, 'helloworld/helloworldHttp');
const zipFilePath = '/tmp/function-source.zip';

// Initialize the Google Cloud Storage and Functions clients
const storage = new Storage({projectId});
const functionsClient = new FunctionServiceClient();

async function zipSourceCode() {
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(functionSourceDir, false);
    archive.finalize();
  });
}

async function createBucket() {
  await storage.createBucket(bucketName, {
    location: 'US',
    uniformBucketLevelAccess: true
  });
  console.log(`Bucket ${bucketName} created.`);
}

async function uploadSourceCode() {
  await storage.bucket(bucketName).upload(zipFilePath, {
    destination: 'function-source.zip'
  });
  console.log('Source code uploaded to Cloud Storage.');
}

async function deployFunction(index) {
    console.log(`projectId: ${projectId}`);
    console.log(`location: ${location}`);
    console.log(`functionName: ${functionName}`);

    // Ensure projectId, location, and functionName are valid
    if (!projectId || !location || !functionName) {
      throw new Error('Project ID, location, and function name must be specified.');
    }

    const functionNameFull = `projects/${projectId}/locations/${location}/functions/${functionName}-${index}`;
    const parent = `projects/${projectId}/locations/${location}`;

    console.log(`Deploying function with name: ${functionNameFull}`);
    console.log(`Parent path: ${parent}`);

    const request = {
      parent: parent,  // Correctly formatted parent path
      function: {
        name: functionNameFull,
        description: 'My Google Cloud Function v2',
        buildConfig: {
          runtime: 'nodejs20',
          entryPoint: 'helloHttp',  // Entry point function name in your source code
          source: {
            storageSource: {
              bucket: bucketName,
              object: 'function-source.zip'
            }
          }
        },
        serviceConfig: {
          availableMemory: '256M',
          timeoutSeconds: 60,
          maxInstanceCount: 1
        },
        // Adding the environment for Cloud Functions v2
        environment: "GEN_2"  // This is required for v2 functions
      },
      functionId: `${functionName}-${index}`
    };

    console.log('Request object:', JSON.stringify(request, null, 2));

    try {
      const [operation] = await functionsClient.createFunction(request);

      console.log('Deploying function...');
      await operation.promise();
      console.log('Function deployed.');
    } catch (error) {
      console.error('Error in deployment:', error);
    }
  }

  async function listFunctions() {
    const [functions] = await functionsClient.listFunctions({
      parent: `projects/${projectId}/locations/-`,
    });
    console.info(functions);
  }

async function setIamPolicy() {
  const functionPath = `projects/${projectId}/locations/${location}/functions/${functionName}`;
  const [policy] = await functionsClient.getIamPolicy({
    resource: functionPath
  });

  policy.bindings.push({
    role: 'roles/cloudfunctions.invoker',
    members: ['allUsers']
  });

  await functionsClient.setIamPolicy({
    resource: functionPath,
    policy
  });

  console.log('IAM policy updated to allow public access.');
}

async function main() {
  try {
    // await listFunctions()

    // Step 1: Zip the source code
    await zipSourceCode();

    // Step 2: Create a Google Cloud Storage bucket
    await createBucket();

    // Step 3: Upload the zipped source code to the bucket
    await uploadSourceCode();

    // Step 4: Deploy the Cloud Function v2
    for (let i = 1; i < 51; i++) {
        await deployFunction(i);
    }

    // Step 5: Set the IAM policy to make the function publicly accessible
    await setIamPolicy();

    console.log(`Google Cloud Function v2 deployed and publicly accessible.`);
  } catch (error) {
    console.error('Error deploying function:', error);
    console.error(JSON.stringify(error.statusDetails, null, 2))
  }
}

main();
