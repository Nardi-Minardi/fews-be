import fetch from 'node-fetch';
import { Logger } from '@nestjs/common';

export class SimpadhuApi {
  private readonly baseUrl: string;
  private readonly logger = new Logger(SimpadhuApi.name);

  constructor() {
    this.baseUrl = process.env.SIMPADHU_URL ?? '';
    if (!this.baseUrl) {
      this.logger.error('SIMPADHU_URL is not configured');
      throw new Error('SIMPADHU_URL is not configured');
    }

    // pastikan tanpa slash double
    this.baseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    this.logger.debug(`Initialized with baseUrl: ${this.baseUrl}`);
  }

  async generateVoucher() {
    const url = `${this.baseUrl}/generate-voucher`;
    this.logger.debug(`Calling generateVoucher API`, { url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.debug(`Response status: ${response.status}`);

    if (!response.ok) {
      this.logger.error(`Failed to fetch voucher`, {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to fetch voucher. Status: ${response.status}`);
    }

    const data = await response.json();
    this.logger.debug('Voucher API raw response', { data });

    if (data.success === false) {
      this.logger.error('Voucher API returned an error', { data });
      throw new Error('Voucher API returned an error');
    }

    this.logger.debug('Voucher API success response', { data });
    return data;
  }
}
