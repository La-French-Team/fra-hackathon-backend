const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '__generated__');
fs.mkdirSync(outputDir, { recursive: true });

function run () {
  const createdLOs = [];

  const steps = fs.readdirSync(__dirname).filter(f => f.startsWith('step'));
  for (const step of steps) {
    fs.mkdirSync(path.join(outputDir, step));
    const jsonFiles = fs.readdirSync(path.join(__dirname, step)).filter(f => f.endsWith('.json'));
    
    const requestGroups = [{
      parallel: false,
      requests: []
    }];
    for (const jsonFile of jsonFiles) {
      const nameSplit = jsonFile.split('_');
      const action = nameSplit[0] === 'createevent' ? 'create_event' : nameSplit[0];
      const type = `${nameSplit[1][0].toUpperCase()}${nameSplit[1].slice(1)}`;
      const id = nameSplit[2].split('.json')[0];

      try {
        if (action === 'create') {
          requestGroups[0].requests.push({
            action: 'create_lo',
            tenant: 'geodis',
            type: type, 
            params: {
              id: id
            },
            body: JSON.parse(fs.readFileSync(path.join(__dirname, step, jsonFile), 'utf-8'))
          });
          createdLOs.push({
            type,
            id
          });
        } else if (action === 'update') {
          requestGroups[0].requests.push({
            action: 'update_lo',
            tenant: 'geodis',
            type: type,
            loId: id,
            memberIdentifier: '{geodis}/members/geodis',
            body: JSON.parse(fs.readFileSync(path.join(__dirname, step, jsonFile), 'utf-8'))
          });
        } else if (action === 'create_event') {
          requestGroups[0].requests.push({
            action: 'create_event',
            tenant: 'geodis',
            type: type,
            loId: id,
            params: {
              id: `${id}_${nameSplit[3].split('.json')[0]}`
            },
            body: JSON.parse(fs.readFileSync(path.join(__dirname, step, jsonFile), 'utf-8'))
          });
        }
      } catch (error) {
        console.error(`[ERROR] ${step} - ${jsonFile}`);
        throw error;
      }
    }
    
    fs.writeFileSync(path.join(outputDir, step, `${step}.json`), JSON.stringify(requestGroups, null, 2));
  }

  // generate deleteAllStep
  const deleteAllRequestGroups = [{
    parallel: false,
    requests: []
  }]
  for (const createdLO of createdLOs) {
    deleteAllRequestGroups[0].requests.push({
      action: 'delete',
      tenant: 'geodis',
      type: createdLO.type,
      loId: createdLO.id
    });
  }
  fs.writeFileSync(path.join(outputDir, 'step-99 delete_all_created_los.json'), JSON.stringify(deleteAllRequestGroups, null, 2));
}

run();