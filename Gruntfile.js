module.exports = function( grunt ) {

grunt.loadNpmTasks( "grunt-jquery-content" );

grunt.initConfig({
	"copy-foundation-docs": {
		"board-members.md": "board-members.md",
		"bylaws.md": "bylaws.md",
		"mission.md": "mission.md",
		"team-members.md": "team-members.md",
		"trademark-policy.md": "trademark-policy.md",
		"travel-policy.md": "travel-policy.md"
	},
	"build-posts": {
		page: "pages/**"
	},
	"build-resources": {
		all: "resources/**"
	},
	wordpress: (function() {
		var config = require( "./config" );
		config.dir = "dist/wordpress";
		return config;
	})()
});

grunt.registerTask( "build-members-page", function() {
	var memberContent,
		members = require( "./data/members" ),
		path = grunt.config( "wordpress.dir" ) + "/posts/page/members.html",
		content = grunt.file.read( path );

	memberContent = Object.keys( members.corporate ).map(function( level ) {
		var rowOpen,
			rowClose,
			memberCount = 1,
			prettyLevel = level.replace( /^\w/, function( character ) {
			return character.toUpperCase();
		}) + " Members";

		return "<h2 class='block'>" + prettyLevel + "</h2>\n" +
			members.corporate[ level ].map(function( member ) {
				var logoPath = "/resources/members/" +
					member.name.toLowerCase().replace( /[^a-z0-9]/g, "" ) + ".png";

				if ( memberCount % 2 ) {
					rowOpen = "<div class='row'>\n";
					rowClose = "";
				} else {
					rowOpen = "";
					rowClose = "</div>";
				}

				memberCount++;

				return rowOpen + "<div class='six mobile columns corporatemembers'>\n" +
					"<div class='row'>\n" +
						"<div class='four mobile columns'>\n" +
							"<a href='" + member.url + "'>\n" +
								"<img src='" + logoPath + "'>\n" +
							"</a>\n" +
						"</div>\n" +
						"<div class='eight mobile columns'>\n" +
							member.description +
						"</div>\n" +
					"</div>\n</div>\n" + rowClose;
			}).join( "\n" );
	}).join( "</div>\n" );

	content = content.replace( "{{corporate-members}}", memberContent );
	grunt.file.write( path, content );
});

grunt.registerMultiTask( "copy-foundation-docs", function() {
	var github = require( "github-request" ),
		done = this.async(),
		src = this.target,
		dest = "pages/" + this.data,
		token = grunt.config( "wordpress.githubToken" );

	if ( !token ) {
		grunt.log.error( "Missing githubToken in config.json" );
		return done( false );
	}

	github.request({
		headers: {
			Authorization: "token " + token
		},
		path: "/repos/jquery/foundation/contents/documents/" + src
	}, function( error, file ) {
		if ( error ) {
			grunt.log.error( error );
			return done( false );
		}

		var content = new Buffer( file.content, file.encoding ).toString( "utf8" ),
			lines = content.split( "\n" ),
			title = lines.shift().substring( 2 );

		content =
			"<script>" + JSON.stringify({
				title: title,
				pageTemplate: "page-fullwidth.php"
			}, null, "\t" ) + "</script>\n" +
			lines.join( "\n" );

		grunt.file.write( dest, content );
		grunt.log.writeln( "Copied " + src + " from foundation repo." );
		done();
	});
});

grunt.registerTask( "build", [ "build-posts", "build-members-page", "build-resources" ] );

};
