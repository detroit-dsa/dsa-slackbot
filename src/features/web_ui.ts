import { Botkit } from 'botkit';
import * as path from 'path';

export default function (controller: Botkit): void {
  // make public/index.html available as localhost/index.html
  // by making the /public folder a static/public asset
  controller.publicFolder('/', path.join(__dirname, '..', 'public'));

  console.log('Chat with me: http://localhost:' + (process.env.PORT || 3000));
}
