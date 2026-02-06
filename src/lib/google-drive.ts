import { google, drive_v3, Auth } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

export interface DriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  refreshToken?: string
}

export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null
  private oauth2Client: Auth.OAuth2Client | null = null

  constructor(private config: DriveConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )

    if (config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
      })
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    }
  }

  getAuthUrl(): string {
    if (!this.oauth2Client) throw new Error('OAuth client not initialized')
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    })
  }

  async getTokenFromCode(code: string): Promise<string> {
    if (!this.oauth2Client) throw new Error('OAuth client not initialized')
    const { tokens } = await this.oauth2Client.getToken(code)
    this.oauth2Client.setCredentials(tokens)
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client })
    return tokens.refresh_token || ''
  }

  setRefreshToken(refreshToken: string): void {
    if (!this.oauth2Client) throw new Error('OAuth client not initialized')
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client })
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    if (!this.drive) throw new Error('Drive not initialized. Please authenticate first.')

    const fileMetadata: drive_v3.Schema$File = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }

    if (parentId) {
      fileMetadata.parents = [parentId]
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    })

    return response.data.id || ''
  }

  async uploadFile(
    name: string,
    content: Buffer | string,
    mimeType: string,
    folderId?: string
  ): Promise<{ id: string; webViewLink: string }> {
    if (!this.drive) throw new Error('Drive not initialized. Please authenticate first.')

    const fileMetadata: drive_v3.Schema$File = { name }
    if (folderId) {
      fileMetadata.parents = [folderId]
    }

    const media = {
      mimeType,
      body: typeof content === 'string' ? Buffer.from(content) : content,
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    })

    return {
      id: response.data.id || '',
      webViewLink: response.data.webViewLink || '',
    }
  }

  async uploadFromUrl(
    name: string,
    url: string,
    mimeType: string,
    folderId?: string
  ): Promise<{ id: string; webViewLink: string }> {
    const response = await fetch(url)
    const buffer = Buffer.from(await response.arrayBuffer())
    return this.uploadFile(name, buffer, mimeType, folderId)
  }

  async listFiles(folderId?: string): Promise<drive_v3.Schema$File[]> {
    if (!this.drive) throw new Error('Drive not initialized. Please authenticate first.')

    let query = "mimeType != 'application/vnd.google-apps.folder'"
    if (folderId) {
      query += ` and '${folderId}' in parents`
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    })

    return response.data.files || []
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) throw new Error('Drive not initialized. Please authenticate first.')
    await this.drive.files.delete({ fileId })
  }

  async getOrCreateFolder(
    name: string,
    parentId?: string
  ): Promise<string> {
    if (!this.drive) throw new Error('Drive not initialized. Please authenticate first.')

    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`
    if (parentId) {
      query += ` and '${parentId}' in parents`
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id)',
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id || ''
    }

    return this.createFolder(name, parentId)
  }
}

export function createDriveService(refreshToken?: string): GoogleDriveService {
  return new GoogleDriveService({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/drive/callback',
    refreshToken: refreshToken || process.env.GOOGLE_REFRESH_TOKEN,
  })
}
