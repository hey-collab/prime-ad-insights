import { prisma } from '@/lib/db'

export async function getSettings() {
  return prisma.settings.findUnique({ where: { id: 'default' } })
}

export async function getGoogleRefreshToken(): Promise<string | null> {
  const settings = await getSettings()
  return settings?.googleRefreshToken || null
}
