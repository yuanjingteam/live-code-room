'use client';

import Head from 'next/head';
import Image from 'next/image';
import * as React from 'react';
import '@/lib/env';

import test1 from '../../public/images/test1.svg'
import test2 from '../../public/images/test1.svg'



/**
 * SVGR Support
 * Caveat: No React Props Type.
 *
 * You can override the next-env if the type is important to you
 * @see https://stackoverflow.com/questions/68103844/how-to-override-next-js-svg-module-declaration
 */
// !STARTERCONF -> Select !STARTERCONF and CMD + SHIFT + F
// Before you begin editing, follow all comments with `STARTERCONF`,
// to customize the default configuration.

export default function HomePage() {
  return (
    <main>
      <Head>
        <title>Live Code Room</title>
      </Head>
      <section className='bg-white flex'>
        <div>
          <h1>加入房间</h1>
          <Image src={test2} alt="加入房间" />
        </div>
        <div>
          <h1>创建房间</h1>
          <Image src={test1} alt="创建房间" />
        </div>
      </section>
    </main>
  );
}
