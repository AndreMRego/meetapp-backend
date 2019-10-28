import Meetup from '../models/Meetup'
import File from '../models/File'

class OrganizeController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        user_id: req.userId,
      },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'localization', 'date'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    })
    return res.json(meetups)
  }
}

export default new OrganizeController()
