import { initData, deleteData, addEvents } from '../../lib/hackathon/data.js';

test('#initData should create SDL and NeONE data for a given userId', async () => {
  await initData('test_user');
});

test('#addEvents should allow to create NeONE events and SDL events', async () => {
  await addEvents('test_user');
});

test('#deleteData should delete SDL data and NeONE data for a given userId', async () => {
  await deleteData('test_user');
});