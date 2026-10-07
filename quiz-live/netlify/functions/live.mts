import { getStore, getDeployStore } from '@netlify/blobs';
import type { Context, Config } from '@netlify/functions';
import { createHandler } from '../../src/live-core.mjs';

export default async (request: Request,context: Context) => createHandler({
  getStore: () => context.deploy.context === 'production'
    ? getStore({name:'quiz-live-v2',consistency:'strong'})
    : getDeployStore({name:'quiz-live-v2',consistency:'strong'}),
  teacherPin: () => Netlify.env.get('TEACHER_PIN')
})(request);
export const config: Config = {path:'/api/live'};
