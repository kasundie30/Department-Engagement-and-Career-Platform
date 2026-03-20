import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Research, ResearchMongo, ResearchStatus } from './schemas/research.schema';
import {
    CreateResearchDto,
    UpdateResearchDto,
    InviteCollaboratorDto,
} from './dto/research.dto';

/**
 * Cloudflare R2 (S3-compatible) for research document storage.
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */
@Injectable()
export class ResearchService {
    private readonly r2Client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor(
        @InjectModel(Research.name) private researchModel: Model<ResearchMongo>,
    ) {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        this.bucket = process.env.R2_BUCKET_NAME || 'research-docs';
        this.publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

        this.r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async create(ownerId: string, dto: CreateResearchDto): Promise<ResearchMongo> {
        return this.researchModel.create({ ownerId, ...dto });
    }

    async findAll(): Promise<ResearchMongo[]> {
        return this.researchModel.find().sort({ createdAt: -1 }).exec();
    }

    async findById(id: string): Promise<ResearchMongo> {
        const project = await this.researchModel.findById(id);
        if (!project) throw new NotFoundException('Research project not found');
        return project;
    }

    async update(
        id: string,
        requesterId: string,
        dto: UpdateResearchDto,
    ): Promise<ResearchMongo> {
        const project = await this.findById(id);
        this.assertOwner(project, requesterId);
        const updated = await this.researchModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
            .exec();
        if (!updated) throw new NotFoundException('Research project not found');
        return updated;
    }

    async remove(id: string, requesterId: string): Promise<{ deleted: boolean }> {
        const project = await this.findById(id);
        this.assertOwner(project, requesterId);
        await this.researchModel.findByIdAndDelete(id);
        return { deleted: true };
    }

    async inviteCollaborator(
        id: string,
        requesterId: string,
        dto: InviteCollaboratorDto,
    ): Promise<ResearchMongo> {
        const project = await this.findById(id);
        this.assertOwner(project, requesterId);
        const alreadyMember = project.collaborators.includes(dto.userId);
        if (!alreadyMember) {
            project.collaborators.push(dto.userId);
            await project.save();
        }
        // G8.1: Fire-and-forget collaboration invite notification to the invited user
        if (!alreadyMember) {
            const internalToken = process.env.INTERNAL_TOKEN || 'miniproject-internal-auth-token';
            fetch(`${process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"}/api/v1/internal/notifications/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-internal-token': internalToken },
                body: JSON.stringify({
                    userId: dto.userId,
                    type: 'general',
                    message: `You have been invited to collaborate on research project "${project.title}"`,
                    idempotencyKey: `collaboration_invite:${project._id}:${dto.userId}`,
                }),
            }).catch(err => console.error('[research-service] Failed to dispatch collaboration_invite notification:', err));
        }
        return project;
    }

    async removeCollaborator(
        id: string,
        requesterId: string,
        userId: string,
    ): Promise<ResearchMongo> {
        const project = await this.findById(id);
        this.assertOwner(project, requesterId);
        const idx = project.collaborators.indexOf(userId);
        if (idx === -1) throw new NotFoundException('Collaborator not found in project');
        project.collaborators.splice(idx, 1);
        return project.save();
    }

    async uploadDocument(
        id: string,
        requesterId: string,
        file: Express.Multer.File,
    ): Promise<ResearchMongo> {
        const project = await this.findById(id);

        // G5.2: Block uploads to archived projects
        if (project.status === ResearchStatus.ARCHIVED) {
            throw new BadRequestException('Cannot upload documents to an archived project');
        }

        const isOwnerOrCollaborator =
            project.ownerId === requesterId ||
            project.collaborators.includes(requesterId);
        if (!isOwnerOrCollaborator)
            throw new ForbiddenException('Only project members can upload documents');

        const r2Key = `${id}/${Date.now()}-${file.originalname}`;
        try {
            await this.r2Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: r2Key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }),
            );
        } catch (r2Error) {
            throw new ServiceUnavailableException('Document storage is temporarily unavailable');
        }

        try {
            project.documents.push({
                name: file.originalname,
                minioKey: r2Key,           // field name kept for schema compatibility
                uploadedAt: new Date(),
                size: file.size,
            });
            return await project.save();
        } catch (dbError) {
            await this.r2Client.send(
                new DeleteObjectCommand({ Bucket: this.bucket, Key: r2Key }),
            ).catch(err => {
                console.error('Failed to cleanup R2 object after DB failure:', err);
            });
            throw dbError;
        }
    }

    async listDocuments(id: string): Promise<ResearchMongo['documents']> {
        const project = await this.findById(id);
        return project.documents;
    }

    private assertOwner(project: ResearchMongo, requesterId: string) {
        if (project.ownerId !== requesterId) {
            throw new ForbiddenException('Only the project owner can perform this action');
        }
    }
}
