import { parseISO, startOfDay, endOfDay } from 'date-fns'
import { Op } from 'sequelize'
import Meetup from '../models/Meetup'
import User from '../models/User'
import File from '../models/File'

class PaginateController {
  async index(req, res) {
    const { page = 1, date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' })
    }

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parseISO(date)), endOfDay(parseISO(date))],
        },
      },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'localization', 'date'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    })
    return res.json(meetups)
  }
}

export default new PaginateController()
