const express      = require('express');
const router       = express.Router();
const Event        = require('../models/Event');
const Announcement = require('../models/Announcement');
const User         = require('../models/User');
const Faculty      = require('../models/Faculty');
const multer       = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ══════════════════════════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════════════════════════ */
async function requireEventsTeam(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ message: 'Not authenticated.' });
  try {
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'team' || user.team !== 'events')
      return res.status(403).json({ message: 'Access restricted to Events team.' });
    req.currentUser = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid session.' });
  }
}

async function requireAnyTeam(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ message: 'Not authenticated.' });
  try {
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'team')
      return res.status(403).json({ message: 'Team access required.' });
    req.currentUser = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid session.' });
  }
}

/* ══════════════════════════════════════════════════════════
   PUBLIC ROUTES
══════════════════════════════════════════════════════════ */
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ status: { $in: ['open','upcoming','completed','draft'] } })
      .select('title description category eventDate endDate venue status bannerData bannerMime registrationFee companies mentors')
      .sort({ eventDate: 1 }).limit(10).lean();

    const formatted = events.map(e => ({
      _id:         e._id,
      title:       e.title,
      description: e.description,
      date:        e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '',
      time:        e.eventDate ? `${new Date(e.eventDate).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}${e.endDate?' – '+new Date(e.endDate).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):''}` : '',
      status:      e.status.charAt(0).toUpperCase()+e.status.slice(1),
      image:       e.bannerData ? `data:${e.bannerMime};base64,${e.bannerData}` : '/assets/default-event.png',
      registrationFee: Number(e.registrationFee || 0),
      qrImage:     e.qrImageData ? `data:${e.qrImageMime};base64,${e.qrImageData}` : '',
      companies:   (e.companies||[]).map(c => ({ _id:c._id, name:c.name, role:c.role, website:c.website, logo: c.logoData ? `data:${c.logoMime};base64,${c.logoData}` : '' })),
      mentors:     (e.mentors||[]).map(m => ({ _id:m._id, name:m.name, title:m.title, role:m.role, bio:m.bio, linkedin:m.linkedin, photo: m.photoData ? `data:${m.photoMime};base64,${m.photoData}` : '' })),
    }));

    res.json(formatted);
  } catch (err) {
    // On DB error, return dummy data for demo
    res.json([
      {
        _id: 'dummy1',
        title: 'Sample Tech Workshop',
        description: 'Learn the latest in technology',
        date: '25 Mar 2026',
        time: '10:00 – 12:00',
        status: 'Open',
        image: '/assets/default-event.png',
        registrationFee: 100,
        qrImage: '',
        companies: [{ name: 'TechCorp', role: 'sponsor', logo: '' }],
        mentors: []
      }
    ]);
  }
});

router.get('/public/gallery', async (req, res) => {
  try {
    const events = await Event.find({ 'gallery.0': { $exists: true } })
      .select('title gallery._id gallery.caption gallery.mimeType gallery.uploadedAt').lean();
    const allPhotos = [];
    events.forEach(e => e.gallery.forEach(p => allPhotos.push({ photoId:p._id, eventId:e._id, caption:p.caption||e.title, url:`/api/events/${e._id}/gallery/${p._id}/image`, uploadedAt:p.uploadedAt })));
    allPhotos.sort((a,b) => new Date(b.uploadedAt)-new Date(a.uploadedAt));
    res.json(allPhotos.slice(0,20));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/public/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ archived:false, audience:{$in:['all','public']} })
      .populate('postedBy','name').sort({ pinned:-1, createdAt:-1 }).limit(6).lean();
    res.json(announcements.map(a => ({
      _id:a._id, title:a.title, body:a.body,
      date: new Date(a.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),
      author: a.postedBy?.name||'Admin Team',
      icon: a.priority==='high'?'fa-bullhorn':a.pinned?'fa-star':'fa-bullhorn',
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/public/team', async (req, res) => {
  try {
    const teamMembers = await User.find({ role: 'team' }).select('name team teamRole phone').lean();
    const facultyMembers = await Faculty.find({}).select('name designation department qualification ph_number').lean();
    // If no data, return dummy data for demo
    if (!teamMembers.length && !facultyMembers.length) {
      res.json({
        team: [
          { name: 'John Doe', team: 'Events', teamRole: 'Coordinator', phone: '9876543210' },
          { name: 'Jane Smith', team: 'Tech', teamRole: 'Lead', phone: '9876543211' }
        ],
        faculty: [
          { name: 'Dr. Alice Johnson', designation: 'Professor', department: 'Computer Science', qualification: 'PhD', ph_number: '9876543212' },
          { name: 'Prof. Bob Wilson', designation: 'Associate Professor', department: 'Information Technology', qualification: 'MTech', ph_number: '9876543213' }
        ]
      });
      return;
    }
    res.json({ team: teamMembers, faculty: facultyMembers });
  } catch (err) {
    // On DB error, return dummy data
    res.json({
      team: [
        { name: 'John Doe', team: 'Events', teamRole: 'Coordinator', phone: '9876543210' },
        { name: 'Jane Smith', team: 'Tech', teamRole: 'Lead', phone: '9876543211' }
      ],
      faculty: [
        { name: 'Dr. Alice Johnson', designation: 'Professor', department: 'Computer Science', qualification: 'PhD', ph_number: '9876543212' },
        { name: 'Prof. Bob Wilson', designation: 'Associate Professor', department: 'Information Technology', qualification: 'MTech', ph_number: '9876543213' }
      ]
    });
  }
});

/* Public image endpoints */
router.get('/:id/gallery/:photoId/image', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('gallery').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    const photo = event.gallery.find(p => p._id.toString()===req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found.' });
    res.setHeader('Content-Type', photo.mimeType||'image/jpeg');
    res.setHeader('Cache-Control','public, max-age=86400');
    res.send(Buffer.from(photo.data,'base64'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* Company logo */
router.get('/:id/companies/:companyId/logo', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('companies').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    const co = event.companies.find(c => c._id.toString()===req.params.companyId);
    if (!co || !co.logoData) return res.status(404).json({ message: 'Logo not found.' });
    res.setHeader('Content-Type', co.logoMime||'image/png');
    res.setHeader('Cache-Control','public, max-age=86400');
    res.send(Buffer.from(co.logoData,'base64'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* Mentor photo */
router.get('/:id/mentors/:mentorId/photo', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('mentors').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    const mentor = event.mentors.find(m => m._id.toString()===req.params.mentorId);
    if (!mentor || !mentor.photoData) return res.status(404).json({ message: 'Photo not found.' });
    res.setHeader('Content-Type', mentor.photoMime||'image/jpeg');
    res.setHeader('Cache-Control','public, max-age=86400');
    res.send(Buffer.from(mentor.photoData,'base64'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   EVENTS CRUD
══════════════════════════════════════════════════════════ */
router.get('/', requireAnyTeam, async (req, res) => {
  try {
    const { status, category, page=1, limit=20 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;
    const [events, total] = await Promise.all([
      Event.find(filter)
        .select('title description category eventDate endDate venue status registrationFee bannerData bannerMime companies mentors createdBy')
        .populate('createdBy','name teamRole')
        .sort({ eventDate:1 }).skip((page-1)*limit).limit(Number(limit)).lean(),
      Event.countDocuments(filter),
    ]);
    res.json({ events, total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', requireAnyTeam, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('title description category eventDate endDate venue status registrationFee bannerData bannerMime qrImageData qrImageMime companies mentors createdBy gallery tasks agenda registrationOpen registrationClose capacity tags')
      .populate('createdBy','name teamRole')
      .populate('gallery.uploadedBy','name').lean();
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    await Event.findByIdAndUpdate(req.params.id, { $inc:{ views:1 } });
    res.json({ event });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', requireEventsTeam, upload.array('images',5), async (req, res) => {
  try {
    const { title, description, category, eventDate, endDate, venue,
            registrationOpen, registrationClose, capacity, status, tags,
            registrationFee, qrImageData, qrImageMime } = req.body;

    if (!title || !eventDate)
      return res.status(400).json({ message: 'title and eventDate are required.' });

    let bannerData='', bannerMime='';
    if (req.files?.length) {
      bannerData = req.files[0].buffer.toString('base64');
      bannerMime = req.files[0].mimetype;
    }

    const event = await Event.create({
      title, description, category, eventDate, endDate, venue,
      registrationOpen, registrationClose, capacity,
      status: status||'draft',
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      bannerData, bannerMime,
      registrationFee: registrationFee ? Number(registrationFee) : 0,
      qrImageData:  qrImageData  || '',
      qrImageMime:  qrImageMime  || 'image/jpeg',
      createdBy: req.currentUser._id,
    });

    res.status(201).json({ message:'Event created.', event });
  } catch (err) {
    console.error('🔴 POST /events:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', requireEventsTeam, async (req, res) => {
  try {
    const allowed = [
      'title','description','category','eventDate','endDate','venue',
      'registrationOpen','registrationClose','capacity','status','tags',
      'bannerData','bannerMime','registrationFee','qrImageData','qrImageMime',
    ];
    const updates = {};
    allowed.forEach(k => { 
      if (req.body[k] !== undefined) {
        if (k === 'registrationFee') {
          updates[k] = req.body[k] ? Number(req.body[k]) : 0;
        } else {
          updates[k] = req.body[k];
        }
      }
    });
    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new:true })
      .select('title description category eventDate endDate venue status registrationFee bannerData bannerMime qrImageData qrImageMime companies mentors createdBy gallery tasks agenda registrationOpen registrationClose capacity tags');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.json({ message:'Event updated.', event });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', requireEventsTeam, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.json({ message:'Event deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   COMPANY COLLABORATIONS
   GET    /api/events/:id/companies
   POST   /api/events/:id/companies          — add company
   PUT    /api/events/:id/companies/:coId    — update company
   DELETE /api/events/:id/companies/:coId    — remove company
══════════════════════════════════════════════════════════ */
router.get('/:id/companies', requireAnyTeam, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('title companies').lean();
    if (!event) return res.status(404).json({ message:'Event not found.' });
    /* Strip logoData from list — use the /logo endpoint to serve images */
    const companies = event.companies.map(({ _id, name, role, website, description, logoMime, createdAt }) =>
      ({ _id, name, role, website, description, hasLogo: !!(event.companies.find(c=>c._id.toString()===_id.toString())?.logoData), logoMime, createdAt }));
    res.json({ companies });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/companies', requireEventsTeam, async (req, res) => {
  try {
    const { name, role, website, description, logoData, logoMime } = req.body;
    if (!name) return res.status(400).json({ message: 'Company name is required.' });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push: { companies: { name, role, website, description, logoData: logoData||'', logoMime: logoMime||'image/png', addedBy: req.currentUser._id } } },
      { new:true }
    ).select('companies');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    const co = event.companies[event.companies.length-1];
    res.status(201).json({ message:'Company added.', company: { _id:co._id, name:co.name, role:co.role, website:co.website, description:co.description } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/companies/:coId', requireEventsTeam, async (req, res) => {
  try {
    const { name, role, website, description, logoData, logoMime } = req.body;
    const update = {};
    if (name)        update['companies.$.name']        = name;
    if (role)        update['companies.$.role']        = role;
    if (website)     update['companies.$.website']     = website;
    if (description !== undefined) update['companies.$.description'] = description;
    if (logoData)    update['companies.$.logoData']    = logoData;
    if (logoMime)    update['companies.$.logoMime']    = logoMime;
    const event = await Event.findOneAndUpdate(
      { _id:req.params.id, 'companies._id':req.params.coId },
      { $set: update }, { new:true }
    ).select('companies');
    if (!event) return res.status(404).json({ message:'Company not found.' });
    res.json({ message:'Company updated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/companies/:coId', requireEventsTeam, async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { $pull:{ companies:{ _id:req.params.coId } } });
    res.json({ message:'Company removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   MENTOR / JUDGE / SPEAKER COLLABORATIONS
   GET    /api/events/:id/mentors
   POST   /api/events/:id/mentors
   PUT    /api/events/:id/mentors/:mId
   DELETE /api/events/:id/mentors/:mId
══════════════════════════════════════════════════════════ */
router.get('/:id/mentors', requireAnyTeam, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('title mentors').lean();
    if (!event) return res.status(404).json({ message:'Event not found.' });
    const mentors = event.mentors.map(({ _id, name, title, role, bio, linkedin, photoMime, photoData, createdAt }) =>
      ({ _id, name, title, role, bio, linkedin, photoMime, hasPhoto: !!photoData, createdAt }));
    res.json({ mentors });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/mentors', requireEventsTeam, async (req, res) => {
  try {
    const { name, title, role, bio, linkedin, photoData, photoMime } = req.body;
    if (!name) return res.status(400).json({ message: 'Mentor name is required.' });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push: { mentors: { name, title, role, bio, linkedin, photoData:photoData||'', photoMime:photoMime||'image/jpeg', addedBy:req.currentUser._id } } },
      { new:true }
    ).select('mentors');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    const m = event.mentors[event.mentors.length-1];
    res.status(201).json({ message:'Mentor added.', mentor: { _id:m._id, name:m.name, title:m.title, role:m.role, bio:m.bio, linkedin:m.linkedin } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/mentors/:mId', requireEventsTeam, async (req, res) => {
  try {
    const { name, title, role, bio, linkedin, photoData, photoMime } = req.body;
    const update = {};
    if (name)     update['mentors.$.name']      = name;
    if (title)    update['mentors.$.title']     = title;
    if (role)     update['mentors.$.role']      = role;
    if (bio !== undefined)      update['mentors.$.bio']       = bio;
    if (linkedin !== undefined) update['mentors.$.linkedin']  = linkedin;
    if (photoData) update['mentors.$.photoData'] = photoData;
    if (photoMime) update['mentors.$.photoMime'] = photoMime;
    const event = await Event.findOneAndUpdate(
      { _id:req.params.id, 'mentors._id':req.params.mId },
      { $set: update }, { new:true }
    ).select('mentors');
    if (!event) return res.status(404).json({ message:'Mentor not found.' });
    res.json({ message:'Mentor updated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/mentors/:mId', requireEventsTeam, async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { $pull:{ mentors:{ _id:req.params.mId } } });
    res.json({ message:'Mentor removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   AGENDA
══════════════════════════════════════════════════════════ */
router.get('/:id/agenda', requireAnyTeam, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('title agenda').lean();
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.json({ title:event.title, agenda:event.agenda });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/agenda', requireEventsTeam, async (req, res) => {
  try {
    const { time, title, speaker, duration, description, type } = req.body;
    if (!title) return res.status(400).json({ message:'Agenda item title is required.' });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push:{ agenda:{ time, title, speaker, duration, description, type } } },
      { new:true }
    ).select('title agenda');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.status(201).json({ message:'Agenda item added.', agenda:event.agenda });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/agenda/:itemId', requireEventsTeam, async (req, res) => {
  try {
    const { time, title, speaker, duration, description, type } = req.body;
    const event = await Event.findOneAndUpdate(
      { _id:req.params.id, 'agenda._id':req.params.itemId },
      { $set:{ 'agenda.$.time':time,'agenda.$.title':title,'agenda.$.speaker':speaker,'agenda.$.duration':duration,'agenda.$.description':description,'agenda.$.type':type } },
      { new:true }
    ).select('title agenda');
    if (!event) return res.status(404).json({ message:'Agenda item not found.' });
    res.json({ message:'Agenda item updated.', agenda:event.agenda });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/agenda/:itemId', requireEventsTeam, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $pull:{ agenda:{ _id:req.params.itemId } } },
      { new:true }
    ).select('title agenda');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.json({ message:'Agenda item deleted.', agenda:event.agenda });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   TASKS
══════════════════════════════════════════════════════════ */
router.post('/:id/tasks', requireEventsTeam, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push:{ tasks:{ ...req.body, createdBy:req.currentUser._id } } },
      { new:true }
    ).select('tasks');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.status(201).json({ tasks:event.tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/tasks/:taskId', requireEventsTeam, async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findOneAndUpdate(
      { _id:req.params.id, 'tasks._id':req.params.taskId },
      { $set:{ 'tasks.$.status':status } }, { new:true }
    ).select('tasks');
    if (!event) return res.status(404).json({ message:'Task not found.' });
    res.json({ tasks:event.tasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/tasks/:taskId', requireEventsTeam, async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { $pull:{ tasks:{ _id:req.params.taskId } } });
    res.json({ message:'Task removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   GALLERY
══════════════════════════════════════════════════════════ */
router.get('/:id/gallery', requireAnyTeam, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('title gallery')
      .populate('gallery.uploadedBy','name').lean();
    if (!event) return res.status(404).json({ message:'Event not found.' });
    const photos = event.gallery.map(({ _id, caption, mimeType, uploadedBy, uploadedAt }) =>
      ({ _id, caption, mimeType, uploadedBy, uploadedAt }));
    res.json({ title:event.title, photos });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/gallery', requireEventsTeam, async (req, res) => {
  try {
    const { data, mimeType, caption } = req.body;
    if (!data) return res.status(400).json({ message:'Image data is required.' });
    if (data.length*0.75 > 5*1024*1024) return res.status(400).json({ message:'Image too large.' });
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(mimeType))
      return res.status(400).json({ message:'Unsupported image type.' });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $push:{ gallery:{ data, mimeType:mimeType||'image/jpeg', caption:caption||'', uploadedBy:req.currentUser._id, uploadedAt:new Date() } } },
      { new:true }
    ).select('gallery');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    const last = event.gallery[event.gallery.length-1];
    res.status(201).json({ message:'Photo uploaded.', photo:{ _id:last._id, caption:last.caption, mimeType:last.mimeType, uploadedAt:last.uploadedAt } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/gallery/:photoId', requireEventsTeam, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, { $pull:{ gallery:{ _id:req.params.photoId } } }, { new:true }
    ).select('gallery');
    if (!event) return res.status(404).json({ message:'Event not found.' });
    res.json({ message:'Photo deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/gallery/all', requireAnyTeam, async (req, res) => {
  try {
    const { limit=20 } = req.query;
    const events = await Event.find({ 'gallery.0':{ $exists:true } })
      .select('title gallery._id gallery.caption gallery.mimeType gallery.uploadedAt').lean();
    const allPhotos = [];
    events.forEach(e => e.gallery.forEach(p => allPhotos.push({ photoId:p._id, eventId:e._id, eventTitle:e.title, caption:p.caption, mimeType:p.mimeType, uploadedAt:p.uploadedAt, imageUrl:`/api/events/${e._id}/gallery/${p._id}/image` })));
    allPhotos.sort((a,b) => new Date(b.uploadedAt)-new Date(a.uploadedAt));
    res.json({ photos:allPhotos.slice(0,Number(limit)), total:allPhotos.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   ANNOUNCEMENTS
══════════════════════════════════════════════════════════ */
router.get('/announcements/list', requireAnyTeam, async (req, res) => {
  try {
    const { audience, page=1, limit=20 } = req.query;
    const teamAudience = req.currentUser.team;
    const audienceFilter = audience ? { audience } : { audience:{ $in:['all',teamAudience] } };
    const filter = { ...audienceFilter, archived:false };
    const [announcements, total] = await Promise.all([
      Announcement.find(filter).populate('postedBy','name teamRole').populate('event','title eventDate')
        .sort({ pinned:-1, createdAt:-1 }).skip((page-1)*limit).limit(Number(limit)).lean(),
      Announcement.countDocuments(filter),
    ]);
    res.json({ announcements, total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/announcements', requireEventsTeam, async (req, res) => {
  try {
    const { title, body, pinned, event, audience, priority } = req.body;
    if (!title || !body) return res.status(400).json({ message:'title and body are required.' });
    const ann = await Announcement.create({ title, body, pinned:pinned||false, event:event||null, audience:audience||'all', priority:priority||'normal', postedBy:req.currentUser._id });
    const populated = await ann.populate('postedBy','name teamRole');
    res.status(201).json({ message:'Announcement posted.', announcement:populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/announcements/:id', requireEventsTeam, async (req, res) => {
  try {
    const allowed = ['title','body','pinned','event','audience','priority'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const ann = await Announcement.findByIdAndUpdate(req.params.id, updates, { new:true })
      .populate('postedBy','name teamRole').populate('event','title');
    if (!ann) return res.status(404).json({ message:'Announcement not found.' });
    res.json({ message:'Announcement updated.', announcement:ann });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/announcements/:id', requireEventsTeam, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, { archived:true }, { new:true });
    if (!ann) return res.status(404).json({ message:'Announcement not found.' });
    res.json({ message:'Announcement archived.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ══════════════════════════════════════════════════════════
   DASHBOARD STATS
══════════════════════════════════════════════════════════ */
router.get('/stats/dashboard', requireEventsTeam, async (req, res) => {
  try {
    const now = new Date();
    const [totalEvents, upcoming, completed, totalPhotos, totalAnnouncements] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ eventDate:{ $gte:now }, status:{ $in:['open','draft'] } }),
      Event.countDocuments({ status:'completed' }),
      Event.aggregate([{ $project:{ count:{ $size:'$gallery' } } }, { $group:{ _id:null, total:{ $sum:'$count' } } }]),
      Announcement.countDocuments({ archived:false }),
    ]);
    res.json({ stats:{ totalEvents, upcoming, completed, totalPhotos:totalPhotos[0]?.total||0, totalAnnouncements } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;